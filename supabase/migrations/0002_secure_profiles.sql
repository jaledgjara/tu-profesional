-- =============================================================================
-- 0002_secure_profiles.sql
-- =============================================================================
-- Seguridad de producción:
-- 1. Mover full_name y phone de profiles → professionals
-- 2. Agregar email a profiles (validado contra JWT en RLS)
-- 3. Agregar role 'admin' al constraint
-- 4. RLS de producción para las 3 tablas con soporte admin
-- 5. Actualizar RPC nearby_professionals
-- =============================================================================

-- =============================================================================
-- 1. MOVER full_name Y phone A professionals
-- =============================================================================
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text;

UPDATE public.professionals pr
SET full_name = p.full_name, phone = p.phone
FROM public.profiles p
WHERE p.id = pr.id
  AND (p.full_name IS NOT NULL OR p.phone IS NOT NULL);

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS full_name,
  DROP COLUMN IF EXISTS phone;

-- =============================================================================
-- 2. AGREGAR email A profiles
-- =============================================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND p.email IS NULL;

-- =============================================================================
-- 3. AGREGAR admin AL CONSTRAINT DE ROLE
-- =============================================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'professional', 'admin'));

-- =============================================================================
-- 4. RLS PRODUCCIÓN — profiles
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- SELECT: usuario ve su fila, admin ve todo
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: usuario solo su id + role válido + email = JWT, admin puede todo
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (
      auth.uid() = id
      AND role IN ('client', 'professional')
      AND (email IS NULL OR email = auth.jwt() ->> 'email')
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- UPDATE: usuario solo su fila, NO puede cambiar role NI email. Admin sin restricciones
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (
      auth.uid() = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- DELETE: solo admin
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================================================
-- 5. RLS PRODUCCIÓN — professionals
-- =============================================================================
DROP POLICY IF EXISTS "professionals_select_public" ON public.professionals;
DROP POLICY IF EXISTS "professionals_select" ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_insert" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update_own" ON public.professionals;
DROP POLICY IF EXISTS "professionals_update" ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete_admin" ON public.professionals;
DROP POLICY IF EXISTS "professionals_delete" ON public.professionals;

-- SELECT: pros activos son públicos, dueño ve el suyo, admin ve todo
CREATE POLICY "professionals_select"
  ON public.professionals FOR SELECT
  USING (
    is_active = true
    OR auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT: solo si role='professional' en profiles, o admin
CREATE POLICY "professionals_insert"
  ON public.professionals FOR INSERT
  WITH CHECK (
    (
      auth.uid() = id
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'professional'
      )
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- UPDATE: solo dueño o admin
CREATE POLICY "professionals_update"
  ON public.professionals FOR UPDATE
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- DELETE: solo admin
CREATE POLICY "professionals_delete"
  ON public.professionals FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================================================
-- 6. RLS PRODUCCIÓN — user_locations
-- =============================================================================
DROP POLICY IF EXISTS "user_locations_select_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_select" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_insert_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_insert" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_update_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_update" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_delete_own" ON public.user_locations;
DROP POLICY IF EXISTS "user_locations_delete" ON public.user_locations;

-- SELECT
CREATE POLICY "user_locations_select"
  ON public.user_locations FOR SELECT
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- INSERT
CREATE POLICY "user_locations_insert"
  ON public.user_locations FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    )
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- UPDATE
CREATE POLICY "user_locations_update"
  ON public.user_locations FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- DELETE
CREATE POLICY "user_locations_delete"
  ON public.user_locations FOR DELETE
  USING (
    auth.uid() = user_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================================================
-- 7. ACTUALIZAR RPC nearby_professionals
-- =============================================================================
CREATE OR REPLACE FUNCTION public.nearby_professionals(
  user_lat  double precision,
  user_lng  double precision,
  radius_m  integer default 10000
)
RETURNS TABLE (
  id                 uuid,
  full_name          text,
  category           text,
  specialty          text,
  sub_specialties    text[],
  description        text,
  quote              text,
  quote_author       text,
  attends_online     boolean,
  attends_presencial boolean,
  photo_url          text,
  city               text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pr.id,
    pr.full_name,
    pr.category,
    pr.specialty,
    pr.sub_specialties,
    pr.description,
    pr.quote,
    pr.quote_author,
    pr.attends_online,
    pr.attends_presencial,
    pr.photo_url,
    ul.city
  FROM public.professionals pr
  JOIN public.user_locations ul ON ul.user_id = pr.id
  WHERE pr.is_active = true
    AND ST_DWithin(
          ul.geom,
          ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
          radius_m
        );
$$;
