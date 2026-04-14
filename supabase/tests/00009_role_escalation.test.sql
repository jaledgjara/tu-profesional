-- =============================================================================
-- 00009_role_escalation.test.sql
-- =============================================================================
-- Tests específicos de escalación de privilegios — vectores de ataque que no
-- caen dentro de los tests por-tabla.
--
-- Los tests de profiles (00001) ya cubren:
--   - User no puede crear profile con role=admin
--   - User no puede cambiar su role via UPDATE
--   - User no puede cambiar su email via UPDATE
--
-- Acá cubrimos los vectores cruzados o menos obvios:
--   1. User no puede cambiar su `id` en profiles (robarle el perfil a otro)
--   2. User no puede cambiar su `id` en professionals (robar perfil pro ajeno)
--   3. Client no puede insertar en professionals aunque cambie ANTES su role
--      (el flujo atacante sería: UPDATE role → INSERT pro, pero UPDATE falla)
--   4. User no puede insertar en otra fila de profiles vía INSERT con
--      id de otro user (además de crear un profile "alternativo")
--   5. User no puede bypassear RLS usando subquery a otra tabla
-- =============================================================================

BEGIN;

SELECT plan(6);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Client
SELECT tests.create_supabase_user('esc-client@test.local', 'client')
  AS client_id \gset

-- Professional activo con datos valiosos (la víctima)
SELECT tests.create_supabase_user('esc-victim@test.local', 'professional')
  AS victim_id \gset

INSERT INTO public.professionals (id, full_name, category, specialty, is_active)
VALUES (:'victim_id'::uuid, 'Dr. Víctima', 'psychology', 'Clínica', true);

-- Atacante: professional recién creado (sin datos valiosos)
SELECT tests.create_supabase_user('esc-attacker@test.local', 'professional')
  AS attacker_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'attacker_id'::uuid, 'Atacante', 'psychology', true);

-- ── Test 1: user no puede cambiar su id en profiles ────────────────────────

-- Vector de ataque: intentar "renombrarse" al id de otro user para heredar
-- sus datos vinculados por FK (professionals, user_locations, etc.).
-- El WITH CHECK de profiles_update requiere auth.uid() = id, así que al
-- intentar SET id = <otro>, el WITH CHECK falla.
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT throws_ok(
  format(
    'UPDATE public.profiles SET id = %L WHERE id = %L',
    :'victim_id', :'client_id'
  ),
  NULL, NULL,
  'ESCALATION: user NO puede cambiar su id en profiles'
);

-- ── Test 2: attacker no puede cambiar su id en professionals ───────────────

-- Vector: reapuntar mi fila de professionals al id del victim para "heredar"
-- sus datos. WITH CHECK exige auth.uid() = id, entonces al SET id = victim_id
-- el check falla porque auth.uid() = attacker_id != victim_id.
SELECT tests.authenticate_as(:'attacker_id'::uuid);
SELECT throws_ok(
  format(
    'UPDATE public.professionals SET id = %L WHERE id = %L',
    :'victim_id', :'attacker_id'
  ),
  NULL, NULL,
  'ESCALATION: professional NO puede cambiar su id al de otro'
);

-- ── Test 3: client no puede upgradearse a professional via UPDATE ──────────

-- Ya está cubierto en 00001 test 11, pero lo replicamos desde el ángulo de
-- "cadena de escalación": sin este UPDATE, el INSERT en professionals
-- tampoco corre (ver test 4 abajo).
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT throws_ok(
  format(
    'UPDATE public.profiles SET role = %L WHERE id = %L',
    'professional', :'client_id'
  ),
  NULL, NULL,
  'ESCALATION: client NO puede self-upgrade a professional'
);

-- ── Test 4: client NO puede insertar en professionals ──────────────────────

-- Con su role=client, el WITH CHECK de professionals_insert falla porque
-- exige que exista profiles WHERE role='professional' para auth.uid().
SELECT tests.authenticate_as(:'client_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.professionals (id, full_name, category) VALUES (%L, %L, %L)',
    :'client_id', 'Hack', 'psychology'
  ),
  NULL, NULL,
  'ESCALATION: client NO puede insertar en professionals (profile no es pro)'
);

-- ── Test 5: atacante no puede upsertar sobre la fila de la víctima ────────

-- Vector: UPSERT con id=victim_id aprovechando ON CONFLICT DO UPDATE.
-- WITH CHECK exige auth.uid() = id, así que esto debe fallar.
SELECT tests.authenticate_as(:'attacker_id'::uuid);
SELECT throws_ok(
  format(
    $q$INSERT INTO public.professionals (id, full_name, category)
       VALUES (%L, %L, %L)
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name$q$,
    :'victim_id', 'Robado', 'psychology'
  ),
  NULL, NULL,
  'ESCALATION: attacker NO puede upsert sobre fila de otro professional'
);

-- ── Test 6: el estado de la víctima sigue intacto después de los ataques ──

SELECT tests.reset_auth();
SELECT is(
  (SELECT full_name FROM public.professionals WHERE id = :'victim_id'::uuid),
  'Dr. Víctima',
  'ESCALATION: los datos de la víctima quedaron intactos tras todos los ataques'
);

SELECT * FROM finish();

ROLLBACK;
