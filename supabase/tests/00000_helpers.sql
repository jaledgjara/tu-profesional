-- =============================================================================
-- 00000_helpers.sql — Funciones compartidas para tests pgTAP
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Schema dedicado para helpers de test
CREATE SCHEMA IF NOT EXISTS tests;

-- Permitir acceso al schema desde roles autenticados/anon
GRANT USAGE ON SCHEMA tests TO authenticated, anon, service_role;

-- -----------------------------------------------------------------------------
-- tests.create_supabase_user(email, role)
-- Inserta en auth.users + profiles. Devuelve UUID.
-- SECURITY DEFINER: corre como postgres para poder insertar en auth.users
-- y en profiles sin pasar por RLS.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.create_supabase_user(
  p_email text,
  p_role  text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

-- -----------------------------------------------------------------------------
-- tests.create_user_only(email)
-- Solo inserta en auth.users, SIN profile.
-- Para testear "authenticated pero sin profile".
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.create_user_only(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

-- -----------------------------------------------------------------------------
-- tests.authenticate_as(user_id)
-- Simula autenticación: setea JWT claims + role = authenticated.
-- SECURITY DEFINER para poder leer auth.users y hacer set_config.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.authenticate_as(p_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_uid;

  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_uid::text,
      'email', v_email,
      'role', 'authenticated',
      'aud', 'authenticated'
    )::text,
    true
  );

  PERFORM set_config('role', 'authenticated', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.authenticate_as(uuid) TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- tests.authenticate_as_anon()
-- Simula usuario anónimo (no logueado).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.authenticate_as_anon()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.authenticate_as_anon() TO authenticated, anon;

-- -----------------------------------------------------------------------------
-- tests.reset_auth()
-- Vuelve al role postgres (superuser). Usar entre grupos de tests.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.reset_auth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'postgres', true);
END;
$$;

GRANT EXECUTE ON FUNCTION tests.reset_auth() TO authenticated, anon;
