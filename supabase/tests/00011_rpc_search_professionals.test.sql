-- =============================================================================
-- 00011_rpc_search_professionals.test.sql — Tests para search + by_area + counts + location
-- =============================================================================
-- Usa los mismos profesionales de test que nearby (Mendoza coords).
-- Verifica: tsvector match, trigram match, area filter, cursor pagination,
--           professionals_by_area, count_professionals_by_area, get_professional_location.
-- =============================================================================

BEGIN;

SELECT plan(14);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Pro A: TCC + Ansiedad, en Centro Mendoza
SELECT tests.create_supabase_user('search-pro-a@test.local', 'professional')
  AS pro_a_id \gset

INSERT INTO public.professionals (
  id, full_name, category, specialty, sub_specialties, professional_area, is_active
) VALUES (
  :'pro_a_id'::uuid, 'Lic. Analia Gómez', 'psychology',
  'Ansiedad y Depresión', ARRAY['Ansiedad', 'Depresión'], ARRAY['tcc'], true
);

INSERT INTO public.user_locations (user_id, street, number, city, province, geom)
VALUES (
  :'pro_a_id'::uuid, 'San Martín', '100', 'Mendoza', 'Mendoza',
  ST_SetSRID(ST_MakePoint(-68.8272, -32.8908), 4326)::geography
);

-- Forzar refresh del tsvector (el trigger lo hace en INSERT, pero por si acaso)
UPDATE public.professionals SET full_name = full_name WHERE id = :'pro_a_id'::uuid;

-- Pro B: Psicoanálisis, en Godoy Cruz
SELECT tests.create_supabase_user('search-pro-b@test.local', 'professional')
  AS pro_b_id \gset

INSERT INTO public.professionals (
  id, full_name, category, specialty, sub_specialties, professional_area, is_active
) VALUES (
  :'pro_b_id'::uuid, 'Dr. Roberto Pérez', 'psychology',
  'Psicoanálisis', ARRAY['Adultos', 'Pareja'], ARRAY['psicoanalisis'], true
);

INSERT INTO public.user_locations (user_id, street, number, city, province, geom)
VALUES (
  :'pro_b_id'::uuid, 'Perito Moreno', '200', 'Godoy Cruz', 'Mendoza',
  ST_SetSRID(ST_MakePoint(-68.8448, -32.9264), 4326)::geography
);

UPDATE public.professionals SET full_name = full_name WHERE id = :'pro_b_id'::uuid;

-- Pro C: TCC + Trauma, en Luján
SELECT tests.create_supabase_user('search-pro-c@test.local', 'professional')
  AS pro_c_id \gset

INSERT INTO public.professionals (
  id, full_name, category, specialty, sub_specialties, professional_area, is_active
) VALUES (
  :'pro_c_id'::uuid, 'Lic. Camila Torres', 'psychology',
  'Trauma y EMDR', ARRAY['Trauma', 'TEPT'], ARRAY['tcc', 'trauma'], true
);

INSERT INTO public.user_locations (user_id, street, number, city, province, geom)
VALUES (
  :'pro_c_id'::uuid, 'Ruta 7', '500', 'Luján de Cuyo', 'Mendoza',
  ST_SetSRID(ST_MakePoint(-68.8700, -33.0300), 4326)::geography
);

UPDATE public.professionals SET full_name = full_name WHERE id = :'pro_c_id'::uuid;

-- Cliente
SELECT tests.create_supabase_user('search-client@test.local', 'client')
  AS client_id \gset

SELECT tests.authenticate_as(:'client_id'::uuid);

-- ── search_professionals ──────────────────────────────────────────────────

-- Test 1: Buscar "ansiedad" encuentra a Pro A (tsvector match)
SELECT ok(
  (SELECT count(*) > 0 FROM public.search_professionals(
    'ansiedad', -32.8908, -68.8272
  ) WHERE id = :'pro_a_id'::uuid),
  'search: "ansiedad" encuentra pro A via tsvector'
);

-- Test 2: Buscar "analia" encuentra a Pro A (nombre, trigram)
SELECT ok(
  (SELECT count(*) > 0 FROM public.search_professionals(
    'analia', -32.8908, -68.8272
  ) WHERE id = :'pro_a_id'::uuid),
  'search: "analia" encuentra pro A via nombre'
);

-- Test 3: Buscar "psicoanalisis" encuentra a Pro B
SELECT ok(
  (SELECT count(*) > 0 FROM public.search_professionals(
    'psicoanalisis', -32.8908, -68.8272
  ) WHERE id = :'pro_b_id'::uuid),
  'search: "psicoanalisis" encuentra pro B'
);

-- Test 4: Buscar "xyznoexiste" no encuentra nada (de los del test)
SELECT is(
  (SELECT count(*)::int FROM public.search_professionals(
    'xyznoexiste', -32.8908, -68.8272
  ) WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  0,
  'search: query sin match devuelve 0'
);

-- Test 5: Filtro por area — solo TCC
SELECT is(
  (SELECT count(*)::int FROM public.search_professionals(
    '', -32.8908, -68.8272, 20, NULL, NULL, ARRAY['tcc']
  ) WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  2,
  'search: filtro area tcc devuelve 2 pros'
);

-- Test 6: Limit funciona
SELECT is(
  (SELECT count(*)::int FROM public.search_professionals(
    '', -32.8908, -68.8272, 1
  ) WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  1,
  'search: limit=1 devuelve exactamente 1'
);

-- ── professionals_by_area ─────────────────────────────────────────────────

-- Test 7: Area "tcc" devuelve 2 pros (A y C)
SELECT is(
  (SELECT count(*)::int FROM public.professionals_by_area(
    'tcc', -32.8908, -68.8272
  ) WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  2,
  'by_area: "tcc" devuelve 2 pros'
);

-- Test 8: Area "psicoanalisis" devuelve solo Pro B
SELECT is(
  (SELECT count(*)::int FROM public.professionals_by_area(
    'psicoanalisis', -32.8908, -68.8272
  ) WHERE id IN (:'pro_a_id'::uuid, :'pro_b_id'::uuid, :'pro_c_id'::uuid)),
  1,
  'by_area: "psicoanalisis" devuelve 1 pro'
);

-- Test 9: Area inexistente devuelve 0
SELECT is(
  (SELECT count(*)::int FROM public.professionals_by_area(
    'noexiste', -32.8908, -68.8272
  )),
  0,
  'by_area: area inexistente devuelve 0'
);

-- ── count_professionals_by_area ───────────────────────────────────────────

-- Test 10: count incluye "tcc" con al menos 2
SELECT ok(
  (SELECT n >= 2 FROM public.count_professionals_by_area()
   WHERE area_slug = 'tcc'),
  'count_by_area: tcc tiene al menos 2 pros'
);

-- Test 11: count incluye "psicoanalisis" con al menos 1
SELECT ok(
  (SELECT n >= 1 FROM public.count_professionals_by_area()
   WHERE area_slug = 'psicoanalisis'),
  'count_by_area: psicoanalisis tiene al menos 1 pro'
);

-- ── get_professional_location ─────────────────────────────────────────────

-- Test 12: Devuelve lat/lng correctos para Pro A
SELECT ok(
  (SELECT abs(lat - (-32.8908)) < 0.001 AND abs(lng - (-68.8272)) < 0.001
   FROM public.get_professional_location(:'pro_a_id'::uuid)),
  'get_location: lat/lng correctos para pro A'
);

-- Test 13: Devuelve ciudad correcta
SELECT is(
  (SELECT city FROM public.get_professional_location(:'pro_a_id'::uuid)),
  'Mendoza',
  'get_location: city = Mendoza'
);

-- Test 14: Pro sin ubicación devuelve 0 filas
SELECT tests.reset_auth();
SELECT tests.create_supabase_user('search-pro-noloc@test.local', 'professional')
  AS pro_noloc_id \gset
INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'pro_noloc_id'::uuid, 'Pro Sin Ubicacion', 'psychology', true);

SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.get_professional_location(:'pro_noloc_id'::uuid)),
  0,
  'get_location: pro sin ubicación devuelve 0 filas'
);

SELECT * FROM finish();

ROLLBACK;
