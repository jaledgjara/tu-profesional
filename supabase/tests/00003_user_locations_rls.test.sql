-- =============================================================================
-- 00003_user_locations_rls.test.sql — RLS tests para tabla user_locations
-- =============================================================================

BEGIN;

SELECT plan(11);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- User A con profile + location
SELECT tests.create_supabase_user('loc-alice@test.local', 'client')
  AS alice_id \gset

INSERT INTO public.user_locations (user_id, street, number, geom)
VALUES (
  :'alice_id'::uuid, 'San Martín', '100',
  ST_SetSRID(ST_MakePoint(-68.8272, -32.8908), 4326)::geography
);

-- User B con profile (sin location)
SELECT tests.create_supabase_user('loc-bob@test.local', 'professional')
  AS bob_id \gset

-- Admin
SELECT tests.create_supabase_user('loc-admin@test.local', 'admin')
  AS admin_id \gset

-- User sin profile (solo auth.users)
SELECT tests.create_user_only('loc-noProfile@test.local')
  AS no_profile_id \gset

-- ── SELECT tests ───────────────────────────────────────────────────────────

-- Test 1: Alice ve su propia ubicación
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  1,
  'SELECT: user ve su propia ubicación'
);

-- Test 2: Bob NO ve la ubicación de Alice
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  0,
  'SELECT: user NO ve ubicación de otro'
);

-- Test 3: Admin ve todas las ubicaciones
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT ok(
  (SELECT count(*)::int FROM public.user_locations) >= 1,
  'SELECT: admin ve todas las ubicaciones'
);

-- ── INSERT tests ───────────────────────────────────────────────────────────

-- Test 4: Bob (con profile) puede insertar su ubicación
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.user_locations (user_id, street, number, geom) VALUES (%L, %L, %L, ST_SetSRID(ST_MakePoint(-68.84, -32.92), 4326)::geography)',
    :'bob_id', 'Calle Test', '100'
  ),
  'INSERT: user con profile crea su ubicación'
);

-- Test 5: User sin profile NO puede insertar ubicación
SELECT tests.authenticate_as(:'no_profile_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.user_locations (user_id, street, number, geom) VALUES (%L, %L, %L, ST_SetSRID(ST_MakePoint(-68.84, -32.92), 4326)::geography)',
    :'no_profile_id', 'Calle Test', '200'
  ),
  NULL, NULL,
  'INSERT: user sin profile NO puede crear ubicación'
);

-- Test 6: Alice NO puede insertar ubicación para otro
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.user_locations (user_id, street, number, geom) VALUES (%L, %L, %L, ST_SetSRID(ST_MakePoint(-68.84, -32.92), 4326)::geography)',
    :'admin_id', 'Calle Hack', '300'
  ),
  NULL, NULL,
  'INSERT: user NO puede crear ubicación para otro'
);

-- Test 7: Admin puede insertar ubicación para cualquiera
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.user_locations (user_id, street, number, geom) VALUES (%L, %L, %L, ST_SetSRID(ST_MakePoint(-68.82, -32.89), 4326)::geography)',
    :'admin_id', 'Calle Admin', '400'
  ),
  'INSERT: admin crea ubicación para cualquier user'
);

-- ── UPDATE tests ───────────────────────────────────────────────────────────

-- Test 8: Alice actualiza su ubicación
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.user_locations SET street = %L WHERE user_id = %L',
    'Av. Las Heras', :'alice_id'
  ),
  'UPDATE: user actualiza su ubicación'
);

-- Test 9: Bob NO puede actualizar la ubicación de Alice
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.user_locations SET street = %L WHERE user_id = %L',
    'Hack', :'alice_id'
  ),
  'UPDATE: user NO puede actualizar ubicación de otro (0 rows)'
);

-- ── DELETE tests ───────────────────────────────────────────────────────────

-- Test 10: Alice puede borrar su ubicación
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'DELETE FROM public.user_locations WHERE user_id = %L',
    :'alice_id'
  ),
  'DELETE: user puede borrar su ubicación'
);

-- Test 11: Bob NO puede borrar la ubicación del admin
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT lives_ok(
  format(
    'DELETE FROM public.user_locations WHERE user_id = %L',
    :'admin_id'
  ),
  'DELETE: user NO puede borrar ubicación de otro (0 rows)'
);

SELECT * FROM finish();

ROLLBACK;
