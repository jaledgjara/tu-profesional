-- =============================================================================
-- 00000_helpers.sql — Funciones compartidas para tests pgTAP
-- =============================================================================
-- IMPORTANTE: pg_prove corre en un contexto donde:
--   - SECURITY DEFINER no puede hacer set_config('role', ...)
--   - El search_path debe incluir 'extensions' para pgcrypto (crypt/gen_salt)
--   - auth.users no es accesible desde role=authenticated
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgtap;

-- pgTAP requiere un plan en cada archivo, incluso en helpers
SELECT plan(1);
SELECT pass('helpers loaded');
SELECT * FROM finish();

CREATE SCHEMA IF NOT EXISTS tests;
GRANT USAGE ON SCHEMA tests TO authenticated, anon, service_role;

-- ─── Funciones que acceden a auth.users (SECURITY DEFINER) ─────────────────

CREATE OR REPLACE FUNCTION tests.create_supabase_user(
  p_email text,
  p_role  text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', p_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(), ''
  );

  INSERT INTO public.profiles (id, role, email)
  VALUES (v_uid, p_role, p_email);

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION tests.create_supabase_user(text, text) TO authenticated, anon;

-- ───

CREATE OR REPLACE FUNCTION tests.create_user_only(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token
  ) VALUES (
    v_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', p_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(), now(), ''
  );

  RETURN v_uid;
END;
$$;

GRANT EXECUTE ON FUNCTION tests.create_user_only(text) TO authenticated, anon;

-- ───

CREATE OR REPLACE FUNCTION tests.get_supabase_email(p_uid uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth
AS $$
  SELECT email FROM auth.users WHERE id = p_uid;
$$;

GRANT EXECUTE ON FUNCTION tests.get_supabase_email(uuid) TO authenticated, anon;

-- ─── Funciones que cambian el role de sesión (NO SECURITY DEFINER) ─────────

CREATE OR REPLACE FUNCTION tests.authenticate_as(p_uid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := tests.get_supabase_email(p_uid);

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_uid::text,
      'email', COALESCE(v_email, ''),
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );
  PERFORM set_config('role', 'authenticated', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.authenticate_as(uuid) TO authenticated, anon;

-- ───

CREATE OR REPLACE FUNCTION tests.authenticate_as_anon()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.authenticate_as_anon() TO authenticated, anon;

-- ───

CREATE OR REPLACE FUNCTION tests.reset_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'postgres', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.reset_auth() TO authenticated, anon;
