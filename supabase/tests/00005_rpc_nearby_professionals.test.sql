-- =============================================================================
-- 00005_rpc_nearby_professionals.test.sql — Tests para RPC nearby_professionals
-- =============================================================================
-- Coordenadas de test:
--   Pro A: Centro Mendoza    (-32.8908, -68.8272)
--   Pro B: Godoy Cruz        (-32.9264, -68.8448) — ~4km del centro
--   Pro C: Buenos Aires      (-34.6037, -58.3816) — ~1000km
--
-- NOTA importante sobre aislamiento:
--   El seed.sql inserta un profesional en Mendoza (Valentina Ruiz) que queda
--   en la DB cuando supabase start aplica el seed. Por eso cada test que
--   cuenta resultados filtra por IDs propios (id IN (pro_a, pro_b, pro_c))
--   para no contar profesionales externos.
-- =============================================================================

BEGIN;

SELECT plan(8);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Pro A: Centro Mendoza (activo)
SELECT tests.create_supabase_user('pro-mendoza@test.local', 'professional')
  AS pro_a_id \gset

INSERT INTO public.professionals (id, full_name, category, specialty, is_active)
VALUES (:'pro_a_id'::uuid, 'Pro Mendoza', 'psychology', 'Cognitiva', true);

INSERT INTO public.user_locations (user_id, street, number, city, geom)
VALUES (
  :'pro_a_id'::uuid, 'San Martín', '100', 'Mendoza',
  ST_SetSRID(ST_MakePoint(-68.8272, -32.8908), 4326)::geography
);

-- Pro B: Godoy Cruz (activo, ~4km)
SELECT tests.create_supabase_user('pro-godoycruz@test.local', 'professional')
  AS pro_b_id \gset

INSERT INTO public.professionals (id, full_name, category, specialty, is_active)
VALUES (:'pro_b_id'::uuid, 'Pro Godoy Cruz', 'psychology', 'Psicoanalisis', true);

INSERT INTO public.user_locations (user_id, street, number, city, geom)
VALUES (
  :'pro_b_id'::uuid, 'Perito Moreno', '200', 'Godoy Cruz',
  ST_SetSRID(ST_MakePoint(-68.8448, -32.9264), 4326)::geography
);

-- Pro C: Buenos Aires (activo, ~1000km)
SELECT tests.create_supabase_user('pro-bsas@test.local', 'professional')
  AS pro_c_id \gset

INSERT INTO public.professionals (id, full_name, category, specialty, is_active)
VALUES (:'pro_c_id'::uuid, 'Pro Buenos Aires', 'psychology', 'Gestalt', true);

INSERT INTO public.user_locations (user_id, street, number, city, geom)
VALUES (
  :'pro_c_id'::uuid, 'Av. Corrientes', '1000', 'CABA',
  ST_SetSRID(ST_MakePoint(-58.3816, -34.6037), 4326)::geography
);

-- Client para queries
SELECT tests.create_supabase_user('nearby-client@test.local', 'client')
  AS client_id \gset

-- ── Tests ──────────────────────────────────────────────────────────────────

-- Test 1: Radio 10km desde centro Mendoza devuelve Pro A + Pro B (de los del test)
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT is(
  (SELECT count(*)::int
   FROM public.nearby_professionals(-32.8908, -68.8272, 10000)
   WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  2,
  'nearby: radio 10km devuelve 2 pros de Mendoza'
);

-- Test 2: Pro C (Buenos Aires) NO aparece en radio 10km
SELECT is(
  (SELECT count(*)::int FROM public.nearby_professionals(-32.8908, -68.8272, 10000)
   WHERE id = :'pro_c_id'::uuid),
  0,
  'nearby: pro fuera de radio NO aparece'
);

-- Test 3: Pro inactivo excluido
SELECT tests.reset_auth();
UPDATE public.professionals SET is_active = false WHERE id = :'pro_a_id'::uuid;
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT is(
  (SELECT count(*)::int
   FROM public.nearby_professionals(-32.8908, -68.8272, 10000)
   WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  1,
  'nearby: pro inactivo excluido del resultado'
);
-- Restaurar
SELECT tests.reset_auth();
UPDATE public.professionals SET is_active = true WHERE id = :'pro_a_id'::uuid;

-- Test 4: Columnas retornadas son correctas (no NULL para campos obligatorios)
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT ok(
  (SELECT full_name IS NOT NULL AND category IS NOT NULL AND id IS NOT NULL
   FROM public.nearby_professionals(-32.8908, -68.8272, 10000)
   LIMIT 1),
  'nearby: columnas retornadas no son NULL'
);

-- Test 5: Radio 1km solo devuelve Pro A (centro) — dentro de los del test
SELECT is(
  (SELECT count(*)::int
   FROM public.nearby_professionals(-32.8908, -68.8272, 1000)
   WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  1,
  'nearby: radio 1km solo devuelve pro más cercano'
);

-- Test 6: Default radius_m=10000 funciona (sin pasar tercer param)
SELECT is(
  (SELECT count(*)::int
   FROM public.nearby_professionals(-32.8908, -68.8272)
   WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  2,
  'nearby: default radius_m=10000 funciona'
);

-- Test 7: Sin matches (coordenadas de Antártida)
SELECT is(
  (SELECT count(*)::int FROM public.nearby_professionals(-82.0, 0.0, 10000)),
  0,
  'nearby: sin matches devuelve 0 filas'
);

-- Test 8: Callable por anon (SECURITY DEFINER + GRANT to anon)
SELECT tests.authenticate_as_anon();
SELECT is(
  (SELECT count(*)::int
   FROM public.nearby_professionals(-32.8908, -68.8272, 10000)
   WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  2,
  'nearby: callable por anon'
);

SELECT * FROM finish();

ROLLBACK;
