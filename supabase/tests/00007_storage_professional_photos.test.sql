-- =============================================================================
-- 00007_storage_professional_photos.test.sql
-- =============================================================================
-- RLS tests para el bucket `professional-photos` (migration 0005).
--
-- Cubrimos los casos canónicos que SON ejecutables por SQL directo:
--   1. Bucket existe con config correcta
--   2. Owner puede INSERT en su path (userId/...)
--   3. User ajeno NO puede INSERT en path de otro
--   4. Anon NO puede INSERT
--   5. Owner puede UPDATE/reemplazar su archivo
--   6. UPDATE afectó el registro (verificamos que cambió)
--   7. User ajeno intenta UPDATE pero 0 rows
--   8. El registro NO fue modificado por el ajeno
--   9. SELECT es público (anon puede leer metadata)
--
-- Nota: el DELETE directo sobre storage.objects está bloqueado por el trigger
-- `storage.protect_delete()` (Supabase lo agregó para proteger archivos
-- huérfanos). Ese caso se cubre en el integration test con la Storage API
-- (tests/integration/storage-service.test.ts — "owner can delete own files").
--
-- Nota sobre el "0 rows" pattern:
--   En PostgreSQL, cuando RLS bloquea un UPDATE, no lanza error — la
--   operación es válida pero afecta 0 filas. Por eso usamos `lives_ok` +
--   chequeo posterior del estado, no `throws_ok`.
-- =============================================================================

BEGIN;

SELECT plan(9);

-- ── Setup ──────────────────────────────────────────────────────────────────

SELECT tests.reset_auth();

-- Dos profesionales
SELECT tests.create_supabase_user('storage-alice@test.local', 'professional')
  AS alice_id \gset

SELECT tests.create_supabase_user('storage-bob@test.local', 'professional')
  AS bob_id \gset

-- ── Test 1: Bucket existe y es público ─────────────────────────────────────

SELECT is(
  (SELECT public FROM storage.buckets WHERE id = 'professional-photos'),
  true,
  'BUCKET: professional-photos existe y es público'
);

-- ── Test 2: Owner puede INSERT en su path ──────────────────────────────────

SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (%L, %L, %L)',
    'professional-photos',
    :'alice_id' || '/avatar.png',
    :'alice_id'
  ),
  'INSERT: owner sube a su propio path'
);

-- ── Test 3: User ajeno NO puede INSERT en path de otro ─────────────────────

SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT throws_ok(
  format(
    'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (%L, %L, %L)',
    'professional-photos',
    :'alice_id' || '/hack.png',  -- path de Alice
    :'bob_id'
  ),
  NULL, NULL,
  'INSERT: user ajeno NO puede subir al path de otro'
);

-- ── Test 4: Anon NO puede INSERT ───────────────────────────────────────────

SELECT tests.authenticate_as_anon();
SELECT throws_ok(
  format(
    'INSERT INTO storage.objects (bucket_id, name, owner) VALUES (%L, %L, NULL)',
    'professional-photos',
    '00000000-0000-0000-0000-000000000000/hack.png'
  ),
  NULL, NULL,
  'INSERT: anon NO puede subir nada'
);

-- ── Test 5: Owner puede UPDATE su archivo ──────────────────────────────────

SELECT tests.authenticate_as(:'alice_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE storage.objects SET metadata = %L::jsonb WHERE bucket_id = %L AND name = %L',
    '{"updated": true}',
    'professional-photos',
    :'alice_id' || '/avatar.png'
  ),
  'UPDATE: owner actualiza su propio archivo'
);

-- Verificar que el UPDATE se aplicó (no fueron 0 filas).
SELECT is(
  (
    SELECT metadata->>'updated'
    FROM storage.objects
    WHERE bucket_id = 'professional-photos'
      AND name = :'alice_id' || '/avatar.png'
  ),
  'true',
  'UPDATE: el metadata quedó efectivamente modificado'
);

-- ── Test 6: User ajeno NO puede UPDATE archivo de otro ─────────────────────

SELECT tests.authenticate_as(:'bob_id'::uuid);
SELECT lives_ok(
  format(
    'UPDATE storage.objects SET metadata = %L::jsonb WHERE bucket_id = %L AND name = %L',
    '{"hacked": true}',
    'professional-photos',
    :'alice_id' || '/avatar.png'
  ),
  'UPDATE: user ajeno NO dispara error pero afecta 0 rows'
);

-- Verificar que el metadata NO cambió (Bob no pudo escribir nada).
SELECT tests.reset_auth();
SELECT is(
  (
    SELECT metadata->>'hacked'
    FROM storage.objects
    WHERE bucket_id = 'professional-photos'
      AND name = :'alice_id' || '/avatar.png'
  ),
  NULL,
  'UPDATE: el archivo de Alice NO fue modificado por Bob'
);

-- ── Test 7: SELECT es público ──────────────────────────────────────────────

SELECT tests.authenticate_as_anon();
SELECT is(
  (
    SELECT count(*)::int
    FROM storage.objects
    WHERE bucket_id = 'professional-photos'
      AND name = :'alice_id' || '/avatar.png'
  ),
  1,
  'SELECT: anon puede leer metadata de objetos del bucket'
);

-- DELETE del owner: Supabase bloquea DELETE directo sobre storage.objects
-- con el trigger `storage.protect_delete()`. Por eso este caso se testea a
-- nivel Storage API en el integration test (storage-service.test.ts), no acá.

SELECT * FROM finish();

ROLLBACK;
