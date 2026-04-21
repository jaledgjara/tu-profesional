-- =============================================================================
-- 00013_reviews_comment_required.test.sql
-- =============================================================================
-- Verifica el CHECK agregado en 0015_reviews_comment_required.sql:
--   - comment NOT NULL
--   - char_length(trim(comment)) > 0  (no solo espacios)
--   - char_length(comment) <= 1000    (heredado del CHECK viejo)
-- =============================================================================

BEGIN;

SELECT plan(5);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

SELECT tests.create_supabase_user('alice-cm@test.local', 'client')
  AS alice_id \gset

SELECT tests.create_supabase_user('doc-cm@test.local', 'professional')
  AS doc_id \gset

INSERT INTO public.professionals (id, full_name, category, is_active)
VALUES (:'doc_id'::uuid, 'Doc CM', 'psychology', true);

SELECT tests.authenticate_as(:'alice_id'::uuid);

-- ── Tests ──────────────────────────────────────────────────────────────────

-- Test 1: INSERT sin comment (NULL) → NOT NULL viola
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating) VALUES (%L, %L, 4)',
    :'doc_id', :'alice_id'
  ),
  '23502',  -- not_null_violation
  NULL,
  'INSERT sin comment (NULL) falla por NOT NULL'
);

-- Test 2: INSERT con comment = '' → CHECK viola
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 4, %L)',
    :'doc_id', :'alice_id', ''
  ),
  '23514',  -- check_violation
  NULL,
  'INSERT con comment vacío falla por CHECK'
);

-- Test 3: INSERT con comment solo espacios → CHECK viola
SELECT throws_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 4, %L)',
    :'doc_id', :'alice_id', '   '
  ),
  '23514',
  NULL,
  'INSERT con comment solo espacios falla por CHECK'
);

-- Test 4: INSERT con comment válido → OK
SELECT lives_ok(
  format(
    'INSERT INTO public.reviews (professional_id, reviewer_id, rating, comment) VALUES (%L, %L, 4, %L)',
    :'doc_id', :'alice_id', 'Buen profesional'
  ),
  'INSERT con comment válido (trim > 0) pasa'
);

-- Test 5: UPDATE que ponga comment a '' → CHECK viola
SELECT throws_ok(
  format(
    'UPDATE public.reviews SET comment = %L WHERE reviewer_id = %L',
    '', :'alice_id'
  ),
  '23514',
  NULL,
  'UPDATE comment = vacío falla por CHECK'
);

SELECT * FROM finish();

ROLLBACK;
