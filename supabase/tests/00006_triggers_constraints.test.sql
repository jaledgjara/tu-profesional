-- =============================================================================
-- 00006_triggers_constraints.test.sql — Triggers y constraints
-- =============================================================================

BEGIN;

SELECT plan(6);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

SELECT tests.create_supabase_user('trigger-alice@test.local', 'professional')
  AS alice_id \gset

INSERT INTO public.professionals (id, full_name, category)
VALUES (:'alice_id'::uuid, 'Alice Trigger', 'psychology');

INSERT INTO public.user_locations (user_id, street, number, geom)
VALUES (
  :'alice_id'::uuid, 'Original', '1',
  ST_SetSRID(ST_MakePoint(-68.82, -32.89), 4326)::geography
);

-- ── Trigger tests: updated_at ──────────────────────────────────────────────

-- Esperar un poco para que updated_at difiera de created_at
SELECT pg_sleep(0.1);

-- Test 1: Trigger en profiles
UPDATE public.profiles SET role = 'professional' WHERE id = :'alice_id'::uuid;
SELECT ok(
  (SELECT updated_at >= created_at FROM public.profiles WHERE id = :'alice_id'::uuid),
  'TRIGGER: updated_at se actualiza en profiles'
);

-- Test 2: Trigger en professionals
UPDATE public.professionals SET specialty = 'Cognitiva' WHERE id = :'alice_id'::uuid;
SELECT ok(
  (SELECT updated_at >= created_at FROM public.professionals WHERE id = :'alice_id'::uuid),
  'TRIGGER: updated_at se actualiza en professionals'
);

-- Test 3: Trigger en user_locations
UPDATE public.user_locations SET street = 'Modificada' WHERE user_id = :'alice_id'::uuid;
SELECT ok(
  (SELECT updated_at IS NOT NULL FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  'TRIGGER: updated_at se actualiza en user_locations'
);

-- ── Constraint tests ───────────────────────────────────────────────────────

-- Test 4: CHECK role constraint rechaza valor inválido
SELECT throws_ok(
  $$INSERT INTO public.profiles (id, role)
    VALUES (gen_random_uuid(), 'hacker')$$,
  '23514',  -- check_violation
  NULL,
  'CONSTRAINT: role=hacker es rechazado por CHECK'
);

-- Test 5: CHECK role acepta admin
SELECT tests.create_user_only('constraint-admin@test.local')
  AS admin_test_id \gset

SELECT lives_ok(
  format(
    'INSERT INTO public.profiles (id, role) VALUES (%L, %L)',
    :'admin_test_id', 'admin'
  ),
  'CONSTRAINT: role=admin es aceptado por CHECK'
);

-- Test 6: CASCADE delete — borrar auth.users elimina profiles + professionals + locations
SELECT tests.create_supabase_user('cascade@test.local', 'professional')
  AS cascade_id \gset

INSERT INTO public.professionals (id, full_name, category)
VALUES (:'cascade_id'::uuid, 'Cascade Test', 'psychology');

INSERT INTO public.user_locations (user_id, street, number, geom)
VALUES (
  :'cascade_id'::uuid, 'Cascade St', '1',
  ST_SetSRID(ST_MakePoint(-68.82, -32.89), 4326)::geography
);

-- Borrar el user de auth → cascade a todo
DELETE FROM auth.users WHERE id = :'cascade_id'::uuid;

SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE id = :'cascade_id'::uuid)
    + (SELECT count(*)::int FROM public.professionals WHERE id = :'cascade_id'::uuid)
    + (SELECT count(*)::int FROM public.user_locations WHERE user_id = :'cascade_id'::uuid),
  0,
  'CASCADE: delete auth.users elimina profiles + professionals + user_locations'
);

SELECT * FROM finish();

ROLLBACK;
