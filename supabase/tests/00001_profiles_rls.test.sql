-- =============================================================================
-- 00001_profiles_rls.test.sql — RLS tests para tabla profiles
-- =============================================================================

BEGIN;

SELECT plan(14);

-- ── Setup: crear usuarios de test ──────────────────────────────────────────

SELECT tests.reset_auth();

-- User A (client)
SELECT tests.create_supabase_user('alice@test.local', 'client')
  AS alice_id \gset

-- User B (professional)
SELECT tests.create_supabase_user('bob@test.local', 'professional')
  AS bob_id \gset

-- Admin
SELECT tests.create_supabase_user('admin@test.local', 'admin')
  AS admin_id \gset

-- User C: solo auth.users, sin profile (para tests de INSERT)
SELECT tests.create_user_only('charlie@test.local')
  AS charlie_id \gset

-- ── SELECT tests ───────────────────────────────────────────────────────────

-- Test 1: User A puede ver su propio profile
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE id = :'alice_id'::uuid),
  1,
  'SELECT: user ve su propio profile'
);

-- Test 2: User A NO puede ver el profile de User B
SELECT is(
  (SELECT count(*)::int FROM public.profiles WHERE id = :'bob_id'::uuid),
  0,
  'SELECT: user NO ve profile de otro'
);

-- Test 3: Admin ve todos los profiles
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT ok(
  (SELECT count(*)::int FROM public.profiles) >= 3,
  'SELECT: admin ve todos los profiles'
);

-- ── INSERT tests ───────────────────────────────────────────────────────────

-- Test 4: Charlie puede crear su profile con role=client
SELECT tests.authenticate_as(:'charlie_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, %L)',
    :'charlie_id', 'client', 'charlie@test.local'
  ),
  'INSERT: user crea profile propio con role=client'
);
-- Limpiar para siguientes tests
SELECT tests.reset_auth();
DELETE FROM public.profiles WHERE id = :'charlie_id'::uuid;

-- Test 5: Charlie puede crear su profile con role=professional
SELECT tests.authenticate_as(:'charlie_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, %L)',
    :'charlie_id', 'professional', 'charlie@test.local'
  ),
  'INSERT: user crea profile propio con role=professional'
);
SELECT tests.reset_auth();
DELETE FROM public.profiles WHERE id = :'charlie_id'::uuid;

-- Test 6: Charlie NO puede crear profile con role=admin
SELECT tests.authenticate_as(:'charlie_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, %L)',
    :'charlie_id', 'admin', 'charlie@test.local'
  ),
  NULL, NULL,
  'INSERT: non-admin NO puede crear profile con role=admin'
);

-- Test 7: Alice NO puede crear profile para Bob (otro user)
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, %L)',
    :'charlie_id', 'client', 'charlie@test.local'
  ),
  NULL, NULL,
  'INSERT: user NO puede crear profile para otro'
);

-- Test 8: Charlie NO puede crear profile con email distinto al JWT
SELECT tests.authenticate_as(:'charlie_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, %L)',
    :'charlie_id', 'client', 'wrong@email.com'
  ),
  NULL, NULL,
  'INSERT: email debe coincidir con JWT'
);

-- Test 9: Charlie puede crear profile con email=NULL
SELECT tests.authenticate_as(:'charlie_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.profiles (id, role, email) VALUES (%L, %L, NULL)',
    :'charlie_id', 'client'
  ),
  'INSERT: email NULL es permitido'
);
SELECT tests.reset_auth();
DELETE FROM public.profiles WHERE id = :'charlie_id'::uuid;

-- ── UPDATE tests ───────────────────────────────────────────────────────────

-- Test 10: Alice puede actualizar su profile (campo no restringido — no hay más campos libres, pero el UPDATE mismo funciona)
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.profiles SET role = %L, email = %L WHERE id = %L',
    'client', 'alice@test.local', :'alice_id'
  ),
  'UPDATE: user actualiza su profile sin cambiar role ni email'
);

-- Test 11: Alice NO puede cambiar su role
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT throws_ok(
  format(
    'UPDATE public.profiles SET role = %L WHERE id = %L',
    'professional', :'alice_id'
  ),
  NULL, NULL,
  'UPDATE: user NO puede cambiar su role'
);

-- Test 12: Alice NO puede cambiar su email
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT throws_ok(
  format(
    'UPDATE public.profiles SET email = %L WHERE id = %L',
    'hacked@evil.com', :'alice_id'
  ),
  NULL, NULL,
  'UPDATE: user NO puede cambiar su email'
);

-- Test 13: Admin puede cambiar el role de Alice
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.profiles SET role = %L WHERE id = %L',
    'professional', :'alice_id'
  ),
  'UPDATE: admin puede cambiar role de otro user'
);
-- Restaurar
UPDATE public.profiles SET role = 'client' WHERE id = :'alice_id'::uuid;

-- ── DELETE tests ───────────────────────────────────────────────────────────

-- Test 14: Non-admin NO puede borrar profiles (DELETE silenciosamente no borra nada)
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM (
    DELETE FROM public.profiles WHERE id = :'alice_id'::uuid RETURNING 1
  ) t),
  0,
  'DELETE: non-admin NO puede borrar profiles'
);

SELECT * FROM finish();

ROLLBACK;
