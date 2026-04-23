-- =============================================================================
-- 0018_admin_list_rpcs.sql
-- =============================================================================
-- RPCs para listados paginados del panel de admin.
--
-- Por qué RPC (y no un .from('profiles').select(...) directo):
--   1. Query única: devolvemos rows + total en un solo round-trip usando
--      json_build_object. Con el cliente tendríamos que hacer dos llamadas
--      (una con count:'exact', otra con rows) — duplica latencia y no comparte
--      el WHERE de forma tipada.
--   2. Búsqueda server-side: el ILIKE con unaccent vive acá, el cliente sólo
--      pasa el string. Si el dataset crece, acá es donde cambiamos a tsvector
--      sin tocar el front.
--   3. Shape estable: la forma del resultado queda pactada en el RPC, el
--      cliente consume un contrato.
--
-- Seguridad: SECURITY DEFINER + guard is_admin() antes de tocar datos.
-- Un no-admin que invoque la función recibe excepción 42501 (forbidden).
-- =============================================================================


-- =============================================================================
-- admin_list_clients(p_search, p_limit, p_offset)
-- =============================================================================
-- Lista paginada de usuarios con role='client'. Search por email.
--
-- Retorno (json):
--   {
--     "total": 123,
--     "rows": [
--       { id, full_name, email, phone, created_at, is_active }, ...
--     ]
--   }
--
-- Notas:
--   - Decisión de producto: los clientes son ANÓNIMOS. La base solo guarda
--     email (full_name y phone se movieron a professionals en 0002). No se
--     pide nombre en el signup del usuario final. Mantenemos full_name y
--     phone como NULL en el shape del JSON para que el cliente no tenga
--     que ramificar por rol al renderizar.
--   - is_active: placeholder en true. Cuando agreguemos soft-delete a
--     profiles (columna deleted_at), se actualiza el RPC sin romper el front.
--   - Orden: created_at DESC (nuevos arriba).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_clients(
  p_search text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_needle text;
  v_total  bigint;
  v_rows   json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  -- Normalizamos: NULL o trim vacío = sin búsqueda
  v_needle := nullif(btrim(coalesce(p_search, '')), '');

  -- Total antes de limit/offset
  SELECT count(*) INTO v_total
  FROM public.profiles p
  WHERE p.role = 'client'
    AND (v_needle IS NULL OR p.email ILIKE '%' || v_needle || '%');

  -- Filas de la página pedida
  SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) INTO v_rows
  FROM (
    SELECT
      p.id,
      NULL::text   AS full_name,   -- no existe en profiles para clientes
      p.email,
      NULL::text   AS phone,       -- idem
      p.created_at,
      true         AS is_active    -- placeholder hasta soft-delete
    FROM public.profiles p
    WHERE p.role = 'client'
      AND (v_needle IS NULL OR p.email ILIKE '%' || v_needle || '%')
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT  greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) r;

  RETURN json_build_object('total', v_total, 'rows', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_clients(text, integer, integer) TO authenticated;


-- =============================================================================
-- admin_list_professionals(p_status, p_search, p_limit, p_offset)
-- =============================================================================
-- Lista paginada de profesionales (independiente de RequestsScreen, que
-- sólo muestra pending). Filtros:
--   - p_status: 'pending' | 'approved' | 'rejected' | NULL (todos)
--   - p_search: en full_name, email, license o specialty
--
-- Retorno (json):
--   {
--     "total": 45,
--     "rows": [
--       { id, full_name, email, photo_url, license, specialty,
--         professional_area, status, is_active, created_at }, ...
--     ]
--   }
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_list_professionals(
  p_status text    DEFAULT NULL,
  p_search text    DEFAULT NULL,
  p_limit  integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_needle text;
  v_status public.professional_status;
  v_total  bigint;
  v_rows   json;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  v_needle := nullif(btrim(coalesce(p_search, '')), '');

  -- Validamos el status: si viene con valor inválido rompemos explícito.
  -- NULL = todos los estados.
  IF p_status IS NOT NULL AND btrim(p_status) <> '' THEN
    BEGIN
      v_status := p_status::public.professional_status;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'invalid status: %', p_status USING errcode = '22023';
    END;
  END IF;

  -- Total
  SELECT count(*) INTO v_total
  FROM public.professionals pr
  JOIN public.profiles p ON p.id = pr.id
  WHERE (v_status IS NULL OR pr.status = v_status)
    AND (
      v_needle IS NULL
      OR pr.full_name ILIKE '%' || v_needle || '%'
      OR p.email      ILIKE '%' || v_needle || '%'
      OR pr.license   ILIKE '%' || v_needle || '%'
      OR pr.specialty ILIKE '%' || v_needle || '%'
    );

  -- Filas
  SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) INTO v_rows
  FROM (
    SELECT
      pr.id,
      pr.full_name,
      p.email,
      pr.photo_url,
      pr.license,
      pr.specialty,
      pr.professional_area,
      pr.status::text          AS status,
      pr.is_active,
      pr.created_at
    FROM public.professionals pr
    JOIN public.profiles p ON p.id = pr.id
    WHERE (v_status IS NULL OR pr.status = v_status)
      AND (
        v_needle IS NULL
        OR pr.full_name ILIKE '%' || v_needle || '%'
        OR p.email      ILIKE '%' || v_needle || '%'
        OR pr.license   ILIKE '%' || v_needle || '%'
        OR pr.specialty ILIKE '%' || v_needle || '%'
      )
    ORDER BY pr.created_at DESC, pr.id DESC
    LIMIT  greatest(p_limit, 1)
    OFFSET greatest(p_offset, 0)
  ) r;

  RETURN json_build_object('total', v_total, 'rows', v_rows);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_professionals(text, text, integer, integer) TO authenticated;
