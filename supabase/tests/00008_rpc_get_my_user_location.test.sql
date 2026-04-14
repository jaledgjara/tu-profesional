-- =============================================================================
-- 00008_rpc_get_my_user_location.test.sql
-- =============================================================================
-- Tests para la RPC `get_my_user_location` (migration 0004).
--
-- Esta RPC es `security invoker`, así que depende de RLS en user_locations
-- para proteger las filas ajenas. Los tests verifican que:
--   1. Anon recibe error "not authenticated"
--   2. User autenticado sin location recibe 0 filas
--   3. User autenticado con location recibe SU fila (y solo esa)
--   4. lat/lng se extraen correctamente del geography
--   5. Un segundo user NO recibe la location del primero (aislación RLS)
--   6. La grant de execute está puesta correctamente (authenticated, no anon)
-- =============================================================================

BEGIN;

SELECT plan(9);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Alice: client con location en Mendoza centro
SELECT tests.create_supabase_user('rpc-getloc-alice@test.local', 'client')
  AS alice_id \gset

INSERT INTO public.user_locations (
  user_id, street, number, floor, apartment,
  postal_code, city, province, country, geom
)
VALUES (
  :'alice_id'::uuid,
  'San Martín', '100', '2', 'A',
  '5500', 'Mendoza', 'Mendoza', 'Argentina',
  ST_SetSRID(ST_MakePoint(-68.8272, -32.8908), 4326)::geography
);

-- Bob: client sin location
SELECT tests.create_supabase_user('rpc-getloc-bob@test.local', 'client')
  AS bob_id \gset

-- ── Test 1: anon recibe error "not authenticated" ──────────────────────────

SELECT tests.authenticate_as_anon();
SELECT throws_ok(
  $$SELECT * FROM public.get_my_user_location()$$,
  NULL, NULL,
  'RPC: anon NO puede ejecutar (grant execute solo a authenticated)'
);

-- ── Test 2: user autenticado sin location → 0 rows ─────────────────────────

SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.get_my_user_location()),
  0,
  'RPC: user sin location recibe 0 filas'
);

-- ── Test 3: user autenticado con location → exactamente 1 fila ─────────────

SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.get_my_user_location()),
  1,
  'RPC: user con location recibe exactamente 1 fila'
);

-- ── Test 4: los campos textuales vienen correctos ──────────────────────────

SELECT is(
  (SELECT street FROM public.get_my_user_location() LIMIT 1),
  'San Martín',
  'RPC: campo street viene correcto'
);

SELECT is(
  (SELECT floor || '/' || apartment FROM public.get_my_user_location() LIMIT 1),
  '2/A',
  'RPC: campos floor y apartment vienen correctos'
);

-- ── Test 5: lat/lng se extraen correctamente del geography ─────────────────

-- El geometry fue insertado con ST_MakePoint(lng, lat) = (-68.8272, -32.8908).
-- La RPC debe devolver lat=-32.8908 y lng=-68.8272.
SELECT is(
  (SELECT round(lat::numeric, 4) FROM public.get_my_user_location() LIMIT 1),
  -32.8908::numeric,
  'RPC: lat devuelto coincide con ST_Y del geom'
);

SELECT is(
  (SELECT round(lng::numeric, 4) FROM public.get_my_user_location() LIMIT 1),
  -68.8272::numeric,
  'RPC: lng devuelto coincide con ST_X del geom'
);

-- ── Test 6: user_id en la fila devuelta es el del authenticated user ───────

SELECT is(
  (SELECT user_id FROM public.get_my_user_location() LIMIT 1),
  :'alice_id'::uuid,
  'RPC: user_id de la fila es el del caller autenticado'
);

-- ── Test 7: Bob NO recibe la location de Alice ─────────────────────────────

-- Reforzar: aunque exista 1 fila en user_locations (la de Alice), Bob
-- autenticado recibe 0 filas porque la RPC filtra por auth.uid().
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT is(
  (
    SELECT count(*)::int
    FROM public.get_my_user_location()
    WHERE user_id = :'alice_id'::uuid
  ),
  0,
  'RPC: user B NO recibe location de user A (aislación por auth.uid)'
);

SELECT * FROM finish();

ROLLBACK;
