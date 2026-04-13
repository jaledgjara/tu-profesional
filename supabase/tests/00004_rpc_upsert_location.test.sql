-- =============================================================================
-- 00004_rpc_upsert_location.test.sql — Tests para RPC upsert_user_location
-- =============================================================================

BEGIN;

SELECT plan(7);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

SELECT tests.create_supabase_user('rpc-alice@test.local', 'client')
  AS alice_id \gset

SELECT tests.create_user_only('rpc-noprofile@test.local')
  AS no_profile_id \gset

-- ── Tests ──────────────────────────────────────────────────────────────────

-- Test 1: Crea location nueva
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  $$SELECT public.upsert_user_location(
    p_lat := -32.8908,
    p_lng := -68.8272,
    p_street := 'San Martín',
    p_number := '100',
    p_floor := '2',
    p_apartment := 'A',
    p_postal_code := '5500',
    p_city := 'Mendoza'
  )$$,
  'RPC: crea location nueva'
);

-- Test 2: Upsert actualiza sin duplicar (misma PK)
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  $$SELECT public.upsert_user_location(
    p_lat := -32.9000,
    p_lng := -68.8400,
    p_street := 'Av. Las Heras',
    p_number := '200'
  )$$,
  'RPC: upsert actualiza sin duplicar'
);

-- Verificar que solo hay 1 row
SELECT tests.reset_auth();
SELECT is(
  (SELECT count(*)::int FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  1,
  'RPC: solo existe 1 row después del upsert'
);

-- Test 3: Geography Point es correcto (lng=-68.84, lat=-32.90)
SELECT is(
  (SELECT round(ST_X(geom::geometry)::numeric, 4) FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  -68.8400,
  'RPC: ST_X(geom) = lng correcto'
);

-- Test 4: updated_at cambia en el upsert
SELECT tests.authenticate_as(:'alice_id'::uuid);
-- Forzar un pequeño delay para que updated_at difiera
SELECT pg_sleep(0.1);
SELECT public.upsert_user_location(
  p_lat := -32.9100,
  p_lng := -68.8500,
  p_street := 'Belgrano',
  p_number := '300'
);
SELECT tests.reset_auth();
SELECT ok(
  (SELECT updated_at > created_at FROM public.user_locations WHERE user_id = :'alice_id'::uuid) IS NOT FALSE,
  'RPC: updated_at se actualiza en upsert'
);

-- Test 5: Falla sin autenticación (anon)
SELECT tests.authenticate_as_anon();
SELECT throws_ok(
  $$SELECT public.upsert_user_location(
    p_lat := -32.89, p_lng := -68.82,
    p_street := 'Hack', p_number := '999'
  )$$,
  NULL, NULL,
  'RPC: falla sin autenticación'
);

-- Test 6: Falla sin profile (auth OK pero no hay profile)
SELECT tests.authenticate_as(:'no_profile_id'::uuid);
SELECT throws_ok(
  $$SELECT public.upsert_user_location(
    p_lat := -32.89, p_lng := -68.82,
    p_street := 'Hack', p_number := '999'
  )$$,
  NULL, NULL,
  'RPC: falla sin profile (RLS INSERT bloquea)'
);

-- Test 7: Defaults de province y country
SELECT tests.reset_auth();
SELECT is(
  (SELECT province || ', ' || country FROM public.user_locations WHERE user_id = :'alice_id'::uuid),
  'Mendoza, Argentina',
  'RPC: defaults province=Mendoza, country=Argentina'
);

SELECT * FROM finish();

ROLLBACK;
