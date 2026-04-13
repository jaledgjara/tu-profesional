-- =============================================================================
-- 00000_helpers.sql — Funciones compartidas para tests pgTAP
-- =============================================================================
-- Este archivo se ejecuta PRIMERO (orden alfabético por prefijo numérico).
-- Crea funciones helper en el schema "tests" que usan todos los test files.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgtap;

-- Schema dedicado para helpers de test
CREATE SCHEMA IF NOT EXISTS tests;

-- -----------------------------------------------------------------------------
-- tests.create_supabase_user(email, role)
-- Inserta en auth.users + profiles. Devuelve UUID.
-- Uso: SELECT tests.create_supabase_user('alice@test.local', 'client');
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.create_supabase_user(
  p_email text,
  p_role  text DEFAULT 'client'
)
RETURNS uuid
LANGUAGE plpgsql
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

  -- Crear profile con el role indicado
  INSERT INTO public.profiles (id, role, email)
  VALUES (v_uid, p_role, p_email);

  RETURN v_uid;
END;
$$;

-- -----------------------------------------------------------------------------
-- tests.create_user_only(email)
-- Solo inserta en auth.users, SIN profile.
-- Para testear "authenticated pero sin profile" (needs-role state).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.create_user_only(p_email text)
RETURNS uuid
LANGUAGE plpgsql
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

-- -----------------------------------------------------------------------------
-- tests.authenticate_as(user_id)
-- Simula autenticación: setea JWT claims + role = authenticated.
-- Después de llamar esto, auth.uid() devuelve el user_id dado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.authenticate_as(p_uid uuid)
RETURNS void
LANGUAGE plpgsql
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
    true  -- local a la transacción
  );

  PERFORM set_config('role', 'authenticated', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- tests.authenticate_as_anon()
-- Simula usuario anónimo (no logueado).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.authenticate_as_anon()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '{}', true);
  PERFORM set_config('role', 'anon', true);
END;
$$;

-- -----------------------------------------------------------------------------
-- tests.reset_auth()
-- Vuelve al role postgres (superuser). Usar entre grupos de tests.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION tests.reset_auth()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('role', 'postgres', true);
END;
$$;
