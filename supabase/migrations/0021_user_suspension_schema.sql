-- =============================================================================
-- 0021_user_suspension_schema.sql — Suspensión + soft delete de usuarios
-- =============================================================================
-- Sprint B: agrega columnas de moderación a profiles y actualiza las RLS
-- que deben bloquear acciones de usuarios suspendidos o borrados.
--
-- Decisiones:
--   1. Suspensión y soft delete viven en `profiles` (no en professionals),
--      porque son sobre la persona — vale para clientes y profesionales por
--      igual.
--   2. Soft delete (deleted_at != NULL) es nuestro default. Hard delete
--      queda fuera de la UI en V1; si aparece un pedido legal, se hace
--      DELETE manual o con una Edge Function dedicada.
--   3. Admins no se pueden suspender ni eliminar. Las RPCs (0022) lo
--      enforzean; acá sólo dejamos la columna sin NOT NULL constraint.
--   4. Revocación de sesión activa: NO la hacemos a nivel SQL (sería un
--      coste caro en cada query). El mobile detecta suspended_at en su
--      refresh() y cambia su authStatus a 'suspended' — el guard lo
--      redirige a SuspendedScreen (mantiene la sesión viva para que
--      pueda leer la razón y contactar soporte). Si el profile tiene
--      deleted_at, ahí sí se fuerza signOut. La RLS bloquea acciones
--      sensibles durante la ventana hasta el próximo refresh.
--
-- Defensa en profundidad (todos estos chequeos coexisten):
--   - profiles.* policies: usuario puede leer/editar su propio profile
--     (necesita ver suspended_at para que el mobile lo chequee).
--   - reviews.insert: bloqueada si el reviewer está suspendido/borrado.
--   - professionals.select público: filtra los dueños suspendidos/borrados.
-- =============================================================================


-- =============================================================================
-- 1. SCHEMA — columnas de moderación en profiles
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN suspended_at      timestamptz,
  ADD COLUMN suspended_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN suspension_reason text,
  ADD COLUMN deleted_at        timestamptz,
  ADD COLUMN deleted_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Partial indexes: sólo cuestan espacio para las filas moderadas. La gran
-- mayoría de profiles NUNCA tendrá suspended_at/deleted_at — no queremos
-- indexar NULLs.
CREATE INDEX profiles_suspended_idx
  ON public.profiles (suspended_at DESC)
  WHERE suspended_at IS NOT NULL;

CREATE INDEX profiles_deleted_idx
  ON public.profiles (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;


-- =============================================================================
-- 2. HELPER — public.is_user_active(uuid)
-- =============================================================================
-- Devuelve true si el user existe, no está suspendido y no está borrado.
-- Usada por RLS policies para no repetir el chequeo en cada una.
-- SECURITY DEFINER + STABLE para que pueda cachearse dentro de una query
-- y no rompa RLS cuando el que consulta no tiene acceso a otros profiles.

CREATE OR REPLACE FUNCTION public.is_user_active(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_id
      AND suspended_at IS NULL
      AND deleted_at   IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO authenticated, anon;


-- =============================================================================
-- 3. RLS — reviews.insert: bloquea suspendidos/borrados
-- =============================================================================
-- Un cliente suspendido NO puede escribir nuevas reseñas. Sus reseñas viejas
-- siguen ahí (no tocamos reviews.update/delete). La policy se amplía, no
-- se reemplaza — seguimos exigiendo que sea role='client' y reviewer_id =
-- auth.uid().

DROP POLICY IF EXISTS "reviews_insert_client_only" ON public.reviews;

CREATE POLICY "reviews_insert_client_only"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'client'
        AND suspended_at IS NULL
        AND deleted_at   IS NULL
    )
  );


-- =============================================================================
-- 4. RLS — professionals.select: excluye dueños suspendidos/borrados
-- =============================================================================
-- Ampliamos la rama pública de la policy definida en 0014. Dueño y admin
-- siguen viendo todo (incluso si el pro está suspendido el propio dueño
-- debe poder leer su profile para ver la pantalla de "cuenta suspendida").

DROP POLICY IF EXISTS "professionals_select" ON public.professionals;

CREATE POLICY "professionals_select"
  ON public.professionals FOR SELECT
  USING (
    (
      is_active = true
      AND status = 'approved'
      AND public.is_user_active(id)             -- NUEVO gate
    )
    OR auth.uid() = id                           -- dueño ve el suyo siempre
    OR public.is_admin()                         -- admin ve todo
  );


-- =============================================================================
-- 5. RPCs públicas — aplicar is_user_active()
-- =============================================================================
-- Las RPCs SECURITY DEFINER bypasean RLS, así que el filtro va explícito.
-- Redefinimos las mismas funciones de 0014 sumando la llamada al helper.

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
    JOIN public.profiles p        ON p.id = pr.id
    WHERE pr.is_active = true
      AND pr.status = 'approved'
      AND p.suspended_at IS NULL                              -- NUEVO gate
      AND p.deleted_at   IS NULL
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
      JOIN public.profiles p        ON p.id = pr.id
      WHERE pr.is_active = true
        AND pr.status = 'approved'
        AND p.suspended_at IS NULL                            -- NUEVO gate
        AND p.deleted_at   IS NULL
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
    JOIN public.profiles p        ON p.id = pr.id
    WHERE pr.is_active = true
      AND pr.status = 'approved'
      AND p.suspended_at IS NULL                              -- NUEVO gate
      AND p.deleted_at   IS NULL
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

CREATE OR REPLACE FUNCTION public.count_professionals_by_area()
RETURNS TABLE (area_slug text, n integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT area_slug, count(*)::integer
  FROM (
    SELECT unnest(pr.professional_area) AS area_slug
    FROM public.professionals pr
    JOIN public.profiles p ON p.id = pr.id
    WHERE pr.is_active = true
      AND pr.status = 'approved'
      AND p.suspended_at IS NULL                              -- NUEVO gate
      AND p.deleted_at   IS NULL
  ) s
  GROUP BY area_slug;
$$;


-- =============================================================================
-- Fin de 0021_user_suspension_schema.sql
-- =============================================================================
