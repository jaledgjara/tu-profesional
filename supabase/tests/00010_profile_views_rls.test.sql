-- =============================================================================
-- 00010_profile_views_rls.test.sql — RLS + RPC para profile_views
-- =============================================================================
-- Verifica:
--   1. Cualquier authenticated puede INSERT una vista
--   2. Solo el profesional dueño puede SELECT sus visitas
--   3. Un cliente NO puede leer visitas de nadie
--   4. Un profesional NO puede leer visitas de OTRO profesional
--   5. Anon NO puede insertar
--   6. get_my_profile_views() cuenta correctamente este mes vs anterior
-- =============================================================================

BEGIN;

SELECT plan(9);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Profesional A (dueño del perfil que recibe visitas)
SELECT tests.create_supabase_user('pv-pro-a@test.local', 'professional')
  AS pro_a_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'pro_a_id'::uuid, 'Pro A Views', 'psychology', true);

-- Profesional B (otro profesional)
SELECT tests.create_supabase_user('pv-pro-b@test.local', 'professional')
  AS pro_b_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'pro_b_id'::uuid, 'Pro B Views', 'psychology', true);

-- Cliente (visitante)
SELECT tests.create_supabase_user('pv-client@test.local', 'client')
  AS client_id \gset

-- ── Test 1: Cliente puede insertar una vista ──────────────────────────────

SELECT tests.authenticate_as(:'client_id'::uuid);

INSERT INTO public.profile_views (professional_id, viewer_id)
VALUES (:'pro_a_id'::uuid, :'client_id'::uuid);

SELECT pass('RLS: cliente puede insertar vista');

-- ── Test 2: Profesional puede insertar una vista (auto-vista o desde otro) ─

SELECT tests.authenticate_as(:'pro_b_id'::uuid);

INSERT INTO public.profile_views (professional_id, viewer_id)
VALUES (:'pro_a_id'::uuid, :'pro_b_id'::uuid);

SELECT pass('RLS: profesional puede insertar vista');

-- ── Test 3: Pro A puede leer SUS propias visitas ─────────────────────────

SELECT tests.authenticate_as(:'pro_a_id'::uuid);

SELECT is(
  (SELECT count(*)::int FROM public.profile_views
   WHERE professional_id = :'pro_a_id'::uuid),
  2,
  'RLS: pro lee sus propias visitas (2 registradas)'
);

-- ── Test 4: Cliente NO puede leer visitas ────────────────────────────────

SELECT tests.authenticate_as(:'client_id'::uuid);

SELECT is(
  (SELECT count(*)::int FROM public.profile_views),
  0,
  'RLS: cliente NO puede leer visitas de nadie'
);

-- ── Test 5: Pro B NO puede leer visitas de Pro A ─────────────────────────

SELECT tests.authenticate_as(:'pro_b_id'::uuid);

SELECT is(
  (SELECT count(*)::int FROM public.profile_views
   WHERE professional_id = :'pro_a_id'::uuid),
  0,
  'RLS: pro B NO puede leer visitas de pro A'
);

-- ── Test 6: Anon NO puede insertar ───────────────────────────────────────

SELECT tests.authenticate_as_anon();

SELECT throws_ok(
  format(
    'INSERT INTO public.profile_views (professional_id) VALUES (%L::uuid)',
    :'pro_a_id'
  ),
  NULL,
  NULL,
  'RLS: anon NO puede insertar vista'
);

-- ── Test 7: get_my_profile_views — conteo este mes ───────────────────────

-- Insertar visitas como postgres (bypass RLS) para datos controlados
SELECT tests.reset_auth();

-- 3 visitas este mes
INSERT INTO public.profile_views (professional_id, viewer_id, viewed_at)
VALUES
  (:'pro_a_id'::uuid, :'client_id'::uuid, now() - interval '1 day'),
  (:'pro_a_id'::uuid, :'client_id'::uuid, now() - interval '2 days'),
  (:'pro_a_id'::uuid, :'client_id'::uuid, now() - interval '3 days');

-- 2 visitas mes anterior
INSERT INTO public.profile_views (professional_id, viewer_id, viewed_at)
VALUES
  (:'pro_a_id'::uuid, :'client_id'::uuid, date_trunc('month', now()) - interval '5 days'),
  (:'pro_a_id'::uuid, :'client_id'::uuid, date_trunc('month', now()) - interval '10 days');

-- Autenticar como Pro A para llamar la RPC
SELECT tests.authenticate_as(:'pro_a_id'::uuid);

SELECT is(
  (SELECT this_month::int FROM public.get_my_profile_views()),
  5,  -- 2 del test 1-2 + 3 insertadas = 5
  'RPC: this_month cuenta correctamente'
);

-- ── Test 8: get_my_profile_views — conteo mes anterior ───────────────────

SELECT is(
  (SELECT last_month::int FROM public.get_my_profile_views()),
  2,
  'RPC: last_month cuenta correctamente'
);

-- ── Test 9: Pro B no tiene visitas — ambos conteos en 0 ─────────────────

SELECT tests.authenticate_as(:'pro_b_id'::uuid);

SELECT is(
  (SELECT this_month::int FROM public.get_my_profile_views()),
  0,
  'RPC: pro sin visitas retorna 0'
);

SELECT * FROM finish();

ROLLBACK;
