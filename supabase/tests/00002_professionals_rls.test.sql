-- =============================================================================
-- 00002_professionals_rls.test.sql — RLS tests para tabla professionals
-- =============================================================================

BEGIN;

SELECT plan(12);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Pro activo
SELECT tests.create_supabase_user('pro-active@test.local', 'professional')
  AS pro_active_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'pro_active_id'::uuid, 'Pro Activo', 'psychology', true);

-- Pro inactivo
SELECT tests.create_supabase_user('pro-inactive@test.local', 'professional')
  AS pro_inactive_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'pro_inactive_id'::uuid, 'Pro Inactivo', 'psychology', false);

-- Client (no debería poder insertar en professionals)
SELECT tests.create_supabase_user('client@test.local', 'client')
  AS client_id \gset

-- Admin
SELECT tests.create_supabase_user('admin-pro@test.local', 'admin')
  AS admin_id \gset

-- Pro sin row en professionals (para test de INSERT)
SELECT tests.create_supabase_user('pro-new@test.local', 'professional')
  AS pro_new_id \gset

-- ── SELECT tests ───────────────────────────────────────────────────────────

-- Test 1: Cualquier user autenticado ve profesionales activos
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.professionals WHERE id = :'pro_active_id'::uuid),
  1,
  'SELECT: cualquier user ve profesional activo'
);

-- Test 2: Otro user NO ve profesional inactivo
SELECT is(
  (SELECT count(*)::int FROM public.professionals WHERE id = :'pro_inactive_id'::uuid),
  0,
  'SELECT: otro user NO ve profesional inactivo'
);

-- Test 3: Owner ve su propio profesional inactivo
SELECT tests.authenticate_as(:'pro_inactive_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.professionals WHERE id = :'pro_inactive_id'::uuid),
  1,
  'SELECT: owner ve su profesional inactivo'
);

-- Test 4: Admin ve profesional inactivo
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.professionals WHERE id = :'pro_inactive_id'::uuid),
  1,
  'SELECT: admin ve profesional inactivo'
);

-- ── INSERT tests ───────────────────────────────────────────────────────────

-- Test 5: Professional puede crear su row en professionals
SELECT tests.authenticate_as(:'pro_new_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.professionals (id, full_name, category) VALUES (%L, %L, %L)',
    :'pro_new_id', 'Pro Nuevo', 'psychology'
  ),
  'INSERT: professional crea su row'
);

-- Test 6: Client NO puede crear row en professionals
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.professionals (id, full_name, category) VALUES (%L, %L, %L)',
    :'client_id', 'Client Hack', 'psychology'
  ),
  NULL, NULL,
  'INSERT: client NO puede crear row en professionals'
);

-- Test 7: Professional NO puede crear row para otro user
SELECT tests.authenticate_as(:'pro_active_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.professionals (id, full_name, category) VALUES (%L, %L, %L)',
    :'client_id', 'Hack', 'psychology'
  ),
  NULL, NULL,
  'INSERT: professional NO puede crear row para otro'
);

-- Test 8: Admin puede crear row para cualquier user que tenga profile
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.professionals (id, full_name, category) VALUES (%L, %L, %L)',
    :'client_id', 'Admin Created', 'psychology'
  ),
  'INSERT: admin crea row para cualquier user'
);
-- Limpiar
SELECT tests.reset_auth();
DELETE FROM public.professionals WHERE id = :'client_id'::uuid;

-- ── UPDATE tests ───────────────────────────────────────────────────────────

-- Test 9: Owner puede actualizar su row
SELECT tests.authenticate_as(:'pro_active_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.professionals SET specialty = %L WHERE id = %L',
    'Terapia cognitiva', :'pro_active_id'
  ),
  'UPDATE: owner actualiza su professional'
);

-- Test 10: Otro user NO puede actualizar
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.professionals SET specialty = %L WHERE id = %L',
    'Hack', :'pro_active_id'
  ),
  'UPDATE: otro user NO puede actualizar professional ajeno (0 rows)'
);

-- ── DELETE tests ───────────────────────────────────────────────────────────

-- Test 11: Non-admin NO puede borrar (DELETE silenciosamente no borra)
SELECT tests.authenticate_as(:'pro_active_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM (
    DELETE FROM public.professionals WHERE id = :'pro_active_id'::uuid RETURNING 1
  ) t),
  0,
  'DELETE: non-admin NO puede borrar professionals'
);

-- Test 12: Admin puede borrar
SELECT tests.authenticate_as(:'admin_id'::uuid);
SELECT lives_ok(
  format(
    'DELETE FROM public.professionals WHERE id = %L',
    :'pro_new_id'
  ),
  'DELETE: admin puede borrar professionals'
);

SELECT * FROM finish();

ROLLBACK;
