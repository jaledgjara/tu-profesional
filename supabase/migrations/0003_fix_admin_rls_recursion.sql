-- =============================================================================
-- 0003_fix_admin_rls_recursion.sql
-- =============================================================================
-- Fix: Las RLS policies de profiles, professionals y user_locations usaban
--   (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
-- para verificar admin. Eso causa recursión infinita porque la subquery
-- dispara la misma SELECT policy → loop.
--
-- Solución: Función SECURITY DEFINER que bypasea RLS para el check de admin.
-- =============================================================================

-- 1. Crear función is_admin() — SECURITY DEFINER bypasea RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Permitir a todos los roles ejecutarla
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- =============================================================================
-- 2. Reemplazar policies de PROFILES
-- =============================================================================

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    (
      auth.uid() = id
      AND role IN ('client', 'professional')
      AND (email IS NULL OR email = auth.jwt() ->> 'email')
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  USING (
    public.is_admin()
  );

-- =============================================================================
-- 3. Reemplazar policies de PROFESSIONALS
-- =============================================================================

DROP POLICY IF EXISTS "professionals_select" ON public.professionals;
CREATE POLICY "professionals_select"
  ON public.professionals FOR SELECT
  USING (
    is_active = true
    OR auth.uid() = id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "professionals_insert" ON public.professionals;
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
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "professionals_update" ON public.professionals;
CREATE POLICY "professionals_update"
  ON public.professionals FOR UPDATE
  USING (
    auth.uid() = id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "professionals_delete" ON public.professionals;
CREATE POLICY "professionals_delete"
  ON public.professionals FOR DELETE
  USING (
    public.is_admin()
  );

-- =============================================================================
-- 4. Reemplazar policies de USER_LOCATIONS
-- =============================================================================

DROP POLICY IF EXISTS "user_locations_select" ON public.user_locations;
CREATE POLICY "user_locations_select"
  ON public.user_locations FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "user_locations_insert" ON public.user_locations;
CREATE POLICY "user_locations_insert"
  ON public.user_locations FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id
      AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "user_locations_update" ON public.user_locations;
CREATE POLICY "user_locations_update"
  ON public.user_locations FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "user_locations_delete" ON public.user_locations;
CREATE POLICY "user_locations_delete"
  ON public.user_locations FOR DELETE
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );
