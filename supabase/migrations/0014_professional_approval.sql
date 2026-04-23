-- =============================================================================
-- 0014_professional_approval.sql
-- =============================================================================
-- Sistema de aprobación de profesionales (moderación previa a ser visibles)
-- + campos de suscripción (schema-only, sin enforcement en RLS todavía).
--
-- Qué hace esta migración:
--   1. Agrega columnas a professionals:
--        - Aprobación: status, rejection_reason, reviewed_at, reviewed_by
--        - Suscripción: subscription_status, mp_preapproval_id,
--          subscription_ends_at, trial_ends_at
--   2. Backfill: todos los profesionales existentes pasan a status='approved'
--   3. Update RLS:
--        - SELECT público ahora requiere status='approved' (además de is_active)
--        - UPDATE del dueño NO puede tocar campos sensibles (status/suscripción)
--   4. Crea RPCs:
--        - approve_professional(id)
--        - reject_professional(id, reason)
--        - reopen_professional(id)    ← escape hatch manual, sin UI en V1
--   5. Actualiza RPCs públicas para que filtren por status='approved':
--        - nearby_professionals, search_professionals,
--          professionals_by_area, count_professionals_by_area
--
-- Notas de seguridad:
--   - Los RPCs son SECURITY DEFINER y validan is_admin() internamente.
--   - La RLS todavía NO chequea subscription_status. Cuando aterrice la Edge
--     Function de webhook de Mercado Pago, se agregará en otra migración.
-- =============================================================================


-- =============================================================================
-- 1. SCHEMA — columnas nuevas en professionals
-- =============================================================================

-- Enum de estado de aprobación por admin
CREATE TYPE public.professional_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.professionals
  -- Aprobación
  ADD COLUMN status             public.professional_status NOT NULL DEFAULT 'pending',
  ADD COLUMN rejection_reason   text,
  ADD COLUMN reviewed_at        timestamptz,
  ADD COLUMN reviewed_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Suscripción (Mercado Pago) — schema-only en V1, sin enforcement en RLS.
  -- La fuente de verdad será la Edge Function del webhook de MP (fase futura).
  ADD COLUMN subscription_status text NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none','trialing','active','past_due','paused','canceled')),
  ADD COLUMN mp_preapproval_id    text UNIQUE,     -- ID de Preapproval de MP
  ADD COLUMN subscription_ends_at timestamptz,     -- fin del período actual pago
  ADD COLUMN trial_ends_at        timestamptz;     -- fin del trial (si aplica)

-- Backfill: profesionales ya existentes pasan a 'approved' para no bloquearlos.
-- subscription_status queda en 'none' (default); como RLS no lo chequea, no
-- afecta la visibilidad pública.
UPDATE public.professionals SET status = 'approved' WHERE status = 'pending';

-- Indexes para listados del admin (por estado + orden por fecha) y del webhook
CREATE INDEX IF NOT EXISTS professionals_status_created_idx
  ON public.professionals (status, created_at DESC);

CREATE INDEX IF NOT EXISTS professionals_subscription_status_idx
  ON public.professionals (subscription_status);


-- =============================================================================
-- 2. RLS — actualizar policies de professionals
-- =============================================================================

-- 2.1 SELECT: la rama pública ahora requiere status='approved' + is_active=true.
-- Dueño y admin siguen viendo todo (incluyendo pending y rejected).
DROP POLICY IF EXISTS "professionals_select" ON public.professionals;
CREATE POLICY "professionals_select"
  ON public.professionals FOR SELECT
  USING (
    (is_active = true AND status = 'approved')   -- público ve sólo aprobados y activos
    OR auth.uid() = id                            -- dueño ve su propia fila siempre
    OR public.is_admin()                          -- admin ve todo
  );

-- 2.2 UPDATE: admin puede todo, dueño puede editar su perfil pero NO puede
-- tocar campos sensibles (status/suscripción). Se compara cada campo sensible
-- contra el valor actual de la fila (subquery correlacionada) y se exige
-- igualdad estricta (con IS NOT DISTINCT FROM para manejar NULLs).
DROP POLICY IF EXISTS "professionals_update" ON public.professionals;
CREATE POLICY "professionals_update"
  ON public.professionals FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      -- Campos de aprobación: inmutables para el dueño
      AND status               = (SELECT p.status               FROM public.professionals p WHERE p.id = auth.uid())
      AND rejection_reason     IS NOT DISTINCT FROM (SELECT p.rejection_reason     FROM public.professionals p WHERE p.id = auth.uid())
      AND reviewed_at          IS NOT DISTINCT FROM (SELECT p.reviewed_at          FROM public.professionals p WHERE p.id = auth.uid())
      AND reviewed_by          IS NOT DISTINCT FROM (SELECT p.reviewed_by          FROM public.professionals p WHERE p.id = auth.uid())
      -- Campos de suscripción: sólo los puede escribir la Edge Function de MP (service role) o admin
      AND subscription_status  = (SELECT p.subscription_status  FROM public.professionals p WHERE p.id = auth.uid())
      AND mp_preapproval_id    IS NOT DISTINCT FROM (SELECT p.mp_preapproval_id    FROM public.professionals p WHERE p.id = auth.uid())
      AND subscription_ends_at IS NOT DISTINCT FROM (SELECT p.subscription_ends_at FROM public.professionals p WHERE p.id = auth.uid())
      AND trial_ends_at        IS NOT DISTINCT FROM (SELECT p.trial_ends_at        FROM public.professionals p WHERE p.id = auth.uid())
    )
  );


-- =============================================================================
-- 3. RPCs de moderación (aprobar / rechazar / reabrir)
-- =============================================================================
-- Todos SECURITY DEFINER, validan is_admin() internamente y escriben en
-- admin_audit_log via log_admin_action() (definido en 0013_admin_audit_log.sql).

-- 3.1 approve_professional: pasa a 'approved', asegura is_active=true
CREATE OR REPLACE FUNCTION public.approve_professional(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  UPDATE public.professionals
     SET status           = 'approved',
         rejection_reason = NULL,
         reviewed_at      = now(),
         reviewed_by      = auth.uid(),
         is_active        = true
   WHERE id = p_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'professional not found or not pending' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'approve_professional', 'professional', p_id::text, '{}'::jsonb
  );
END;
$$;

-- 3.2 reject_professional: pasa a 'rejected', guarda razón, desactiva
CREATE OR REPLACE FUNCTION public.reject_professional(p_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  IF p_reason IS NULL OR length(btrim(p_reason)) < 10 THEN
    RAISE EXCEPTION 'rejection reason required (min 10 chars)' USING errcode = '22023';
  END IF;

  UPDATE public.professionals
     SET status           = 'rejected',
         rejection_reason = btrim(p_reason),
         reviewed_at      = now(),
         reviewed_by      = auth.uid(),
         is_active        = false
   WHERE id = p_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'professional not found or not pending' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'reject_professional', 'professional', p_id::text,
    jsonb_build_object('reason', btrim(p_reason))
  );
END;
$$;

-- 3.3 reopen_professional: escape hatch manual, reabre un rechazado/aprobado
-- a 'pending' (por ejemplo, si el pro pide re-review). Sin UI en V1.
CREATE OR REPLACE FUNCTION public.reopen_professional(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: caller is not admin' USING errcode = '42501';
  END IF;

  UPDATE public.professionals
     SET status           = 'pending',
         rejection_reason = NULL,
         reviewed_at      = NULL,
         reviewed_by      = NULL
   WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'professional not found' USING errcode = 'P0002';
  END IF;

  PERFORM public.log_admin_action(
    'reopen_professional', 'professional', p_id::text, '{}'::jsonb
  );
END;
$$;

-- Permisos: authenticated puede invocar, pero cada RPC valida is_admin() dentro
GRANT EXECUTE ON FUNCTION public.approve_professional(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_professional(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_professional(uuid)       TO authenticated;


-- =============================================================================
-- 4. RPCs públicas — agregar filtro status='approved'
-- =============================================================================
-- Las policies RLS ya filtran, pero estos RPCs son SECURITY DEFINER y bypasean
-- RLS. Sin este cambio, un profesional pending aparecería en los listados del
-- mobile (search, nearby, by_area). Se redefinen aquí con el mismo contrato.

-- 4.1 nearby_professionals — listado por proximidad con keyset pagination
CREATE OR REPLACE FUNCTION public.nearby_professionals(
  p_user_lat double precision, p_user_lng double precision,
  p_radius_m integer default 10000, p_limit integer default 10,
  p_cursor_distance_m double precision default null, p_cursor_id uuid default null
)
RETURNS TABLE (
  id uuid, full_name text, category text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, quote text, quote_author text,
  attends_online boolean, attends_presencial boolean,
  photo_url text, city text, distance_m double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH user_point AS (
    SELECT st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326) AS g
  ),
  candidates AS (
    SELECT pr.*, ul.city, ul.geom,
           st_distance(ul.geom, (SELECT g FROM user_point)::geography)::double precision AS dist_m
    FROM public.professionals pr
    JOIN public.user_locations ul ON ul.user_id = pr.id
    WHERE pr.is_active = true
      AND pr.status = 'approved'                              -- NUEVO gate
      AND st_dwithin(ul.geom, (SELECT g FROM user_point)::geography, p_radius_m)
  )
  SELECT id, full_name, category, specialty,
         sub_specialties, professional_area,
         description, quote, quote_author,
         attends_online, attends_presencial,
         photo_url, city, dist_m
  FROM candidates c
  WHERE p_cursor_distance_m IS NULL
     OR c.dist_m > p_cursor_distance_m
     OR (c.dist_m = p_cursor_distance_m AND c.id > p_cursor_id)
  ORDER BY c.geom::geometry <-> (SELECT g FROM user_point), c.id
  LIMIT greatest(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.nearby_professionals(
  double precision, double precision, integer, integer, double precision, uuid
) TO authenticated;

-- 4.2 search_professionals — búsqueda full-text + proximidad
CREATE OR REPLACE FUNCTION public.search_professionals(
  p_query text, p_user_lat double precision, p_user_lng double precision,
  p_limit integer default 20,
  p_cursor_distance_m double precision default null,
  p_cursor_id uuid default null,
  p_area_filter text[] default null
)
RETURNS TABLE (
  id uuid, full_name text, category text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, photo_url text, city text, distance_m double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH
    nq  AS (SELECT public.immutable_unaccent(nullif(btrim(p_query), '')) AS norm),
    tsq AS (SELECT CASE WHEN (SELECT norm FROM nq) IS NULL THEN NULL
                        ELSE plainto_tsquery('spanish', (SELECT norm FROM nq)) END AS ts),
    user_point AS (
      SELECT st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326) AS g
    ),
    candidates AS (
      SELECT pr.*, ul.city, ul.geom,
             st_distance(ul.geom, (SELECT g FROM user_point)::geography)::double precision AS dist_m
      FROM public.professionals pr
      JOIN public.user_locations ul ON ul.user_id = pr.id
      WHERE pr.is_active = true
        AND pr.status = 'approved'                            -- NUEVO gate
        AND (
          (SELECT norm FROM nq) IS NULL
          OR pr.search_tsv @@ (SELECT ts FROM tsq)
          OR public.immutable_unaccent(pr.full_name)
               OPERATOR(extensions.%) (SELECT norm FROM nq)
        )
        AND (p_area_filter IS NULL OR pr.professional_area && p_area_filter)
    )
  SELECT id, full_name, category, specialty,
         sub_specialties, professional_area,
         description, photo_url, city, dist_m
  FROM candidates c
  WHERE p_cursor_distance_m IS NULL
     OR c.dist_m > p_cursor_distance_m
     OR (c.dist_m = p_cursor_distance_m AND c.id > p_cursor_id)
  ORDER BY c.geom::geometry <-> (SELECT g FROM user_point), c.id
  LIMIT greatest(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_professionals(
  text, double precision, double precision, integer, double precision, uuid, text[]
) TO authenticated;

-- 4.3 professionals_by_area — listado filtrado por área
CREATE OR REPLACE FUNCTION public.professionals_by_area(
  p_area_slug text, p_user_lat double precision, p_user_lng double precision,
  p_limit integer default 20,
  p_cursor_distance_m double precision default null, p_cursor_id uuid default null
)
RETURNS TABLE (
  id uuid, full_name text, specialty text,
  sub_specialties text[], professional_area text[],
  description text, photo_url text, city text, distance_m double precision
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH user_point AS (
    SELECT st_setsrid(st_makepoint(p_user_lng, p_user_lat), 4326) AS g
  ),
  candidates AS (
    SELECT pr.*, ul.city, ul.geom,
           st_distance(ul.geom, (SELECT g FROM user_point)::geography)::double precision AS dist_m
    FROM public.professionals pr
    JOIN public.user_locations ul ON ul.user_id = pr.id
    WHERE pr.is_active = true
      AND pr.status = 'approved'                              -- NUEVO gate
      AND pr.professional_area && array[p_area_slug]::text[]
  )
  SELECT id, full_name, specialty,
         sub_specialties, professional_area,
         description, photo_url, city, dist_m
  FROM candidates c
  WHERE p_cursor_distance_m IS NULL
     OR c.dist_m > p_cursor_distance_m
     OR (c.dist_m = p_cursor_distance_m AND c.id > p_cursor_id)
  ORDER BY c.geom::geometry <-> (SELECT g FROM user_point), c.id
  LIMIT greatest(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.professionals_by_area(
  text, double precision, double precision, integer, double precision, uuid
) TO authenticated;

-- 4.4 count_professionals_by_area — agregado por área para chips/filtros
CREATE OR REPLACE FUNCTION public.count_professionals_by_area()
RETURNS TABLE (area_slug text, n integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT area_slug, count(*)::integer
  FROM (
    SELECT unnest(pr.professional_area) AS area_slug
    FROM public.professionals pr
    WHERE pr.is_active = true
      AND pr.status = 'approved'                              -- NUEVO gate
  ) s
  GROUP BY area_slug;
$$;

GRANT EXECUTE ON FUNCTION public.count_professionals_by_area() TO authenticated;


-- =============================================================================
-- Fin de 0014_professional_approval.sql
-- =============================================================================
