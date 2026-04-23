-- =============================================================================
-- 00012_reviews_rls.test.sql — RLS + constraints tests para tabla reviews
-- =============================================================================
-- Cubre:
--   - CHECK constraints (rating 1-5, comment ≤ 1000, no self-review)
--   - UNIQUE (professional_id, reviewer_id)
--   - RLS: solo clients insertan, solo autor edita, autor/admin borra
--   - Anonimato: reviews_public NO expone reviewer_id
-- =============================================================================

BEGIN;

SELECT plan(15);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Client A (alice) — va a dejar una reseña
SELECT tests.create_supabase_user('alice-rev@test.local', 'client')
  AS alice_id \gset

-- Client B (bob) — para tests de edición cruzada y anonimato
SELECT tests.create_supabase_user('bob-rev@test.local', 'client')
  AS bob_id \gset

-- Professional (doc) — el reseñado
SELECT tests.create_supabase_user('doc-rev@test.local', 'professional')
  AS doc_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'doc_id'::uuid, 'Doc Reviewed', 'psychology', true);

-- Admin (root)
SELECT tests.create_supabase_user('root-rev@test.local', 'admin')
  AS root_id \gset

-- ── INSERT tests ───────────────────────────────────────────────────────────

-- Test 1: alice (client) inserta reseña válida con comment
-- Nota: desde 0017, comment es NOT NULL + CHECK trim()>0 (ver 00013).
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 5, %L)',
    :'doc_id', :'alice_id', 'Primera reseña'
  ),
  'INSERT: client crea reseña válida'
);

-- Test 2: alice intenta insertar una SEGUNDA reseña para el mismo pro → UNIQUE
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 3, %L)',
    :'doc_id', :'alice_id', 'Segunda'
  ),
  '23505',
  NULL,
  'INSERT: UNIQUE bloquea segunda reseña por mismo cliente'
);

-- Test 3: bob (client) intenta insertar con comment > 1000 chars → CHECK
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 4, %L)',
    :'doc_id', :'bob_id', repeat('x', 1001)
  ),
  '23514',
  NULL,
  'INSERT: CHECK bloquea comment > 1000 chars'
);

-- Test 4: bob intenta rating=6 → CHECK
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 6, %L)',
    :'doc_id', :'bob_id', 'Intento rating invalido'
  ),
  '23514',
  NULL,
  'INSERT: CHECK bloquea rating > 5'
);

-- Test 5: bob intenta rating=0 → CHECK
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 0, %L)',
    :'doc_id', :'bob_id', 'Intento rating invalido'
  ),
  '23514',
  NULL,
  'INSERT: CHECK bloquea rating < 1'
);

-- Test 6: root (admin, NO client) intenta insertar reseña → RLS bloquea
SELECT tests.authenticate_as(:'root_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 4, %L)',
    :'doc_id', :'root_id', 'Admin intenta'
  ),
  '42501',
  NULL,
  'INSERT: RLS bloquea a no-clients (admin)'
);

-- Test 7: auto-reseña (professional_id = reviewer_id) → CHECK
-- Corremos como postgres para bypassear RLS y llegar al CHECK
SELECT tests.reset_auth();
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 5, %L)',
    :'doc_id', :'doc_id', 'Auto-reseña'
  ),
  '23514',
  NULL,
  'INSERT: CHECK bloquea auto-reseña'
);

-- ── SELECT / anonimato tests ────────────────────────────────────────────────

-- Test 8: bob NO ve la review de alice en la tabla base (RLS solo autor/admin)
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT is(
  (SELECT count(*)::int FROM public.reviews WHERE reviewer_id = :'alice_id'::uuid),
  0,
  'SELECT (base): bob NO ve review de alice en reviews'
);

-- Test 9: bob SÍ ve la review de alice vía reviews_public
SELECT is(
  (SELECT count(*)::int FROM public.reviews_public WHERE professional_id = :'doc_id'::uuid),
  1,
  'SELECT (vista): bob ve la review a través de reviews_public'
);

-- Test 10: reviews_public NO tiene columna reviewer_id (anonimato estructural)
SELECT is(
  (
    SELECT count(*)::int
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'reviews_public'
      AND column_name  = 'reviewer_id'
  ),
  0,
  'VIEW: reviews_public NO expone columna reviewer_id'
);

-- ── UPDATE tests ───────────────────────────────────────────────────────────

-- Test 11: alice actualiza su propia review con comment de 500 chars → OK
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.reviews SET comment = %L, rating = 4 WHERE reviewer_id = %L',
    repeat('a', 500), :'alice_id'
  ),
  'UPDATE: autor actualiza su review'
);

-- Test 12: bob intenta actualizar la review de alice → 0 rows (RLS filtra)
SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE public.reviews SET rating = 1 WHERE reviewer_id = %L',
    :'alice_id'
  ),
  'UPDATE: no-autor no rompe pero afecta 0 rows'
);

-- Verificamos que el rating NO cambió (sigue siendo 4 de test 11)
SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT is(
  (SELECT rating FROM public.reviews WHERE reviewer_id = :'alice_id'::uuid LIMIT 1),
  4,
  'UPDATE: rating intacto tras intento de bob'
);

-- ── DELETE tests ───────────────────────────────────────────────────────────

-- Test 13: admin puede borrar review ajena
SELECT tests.authenticate_as(:'root_id'::uuid);
SELECT lives_ok(
  format(
    'DELETE FROM public.reviews WHERE reviewer_id = %L',
    :'alice_id'
  ),
  'DELETE: admin borra review ajena'
);

-- Confirmar que quedó borrada
SELECT tests.reset_auth();
SELECT is(
  (SELECT count(*)::int FROM public.reviews WHERE reviewer_id = :'alice_id'::uuid),
  0,
  'DELETE: review de alice ya no existe'
);

SELECT * FROM finish();

ROLLBACK;
