-- =============================================================================
-- 0005_storage_policies.sql
-- =============================================================================
-- Crea el bucket `professional-photos` (idempotente) y define las RLS policies
-- sobre storage.objects que restringen quién puede subir/modificar qué archivos.
--
-- Convención de paths:
--   professional-photos/{userId}/avatar.{ext}
--   El primer segmento del path debe ser el userId del dueño del archivo.
--
-- Sin estas policies, cualquier user autenticado puede sobrescribir la foto
-- de cualquier profesional (ver storage-service.test.ts que lo documentaba).
--
-- Nota sobre storage.foldername():
--   Es una función provista por Supabase Storage que parsea el `name` de
--   storage.objects y devuelve el array de "carpetas". Para el path
--   "abc-123/avatar.png", storage.foldername(name) = ARRAY['abc-123'].
--   El elemento [1] es la primera carpeta (PostgreSQL arrays son 1-indexed).
-- =============================================================================

-- 1. Crear el bucket (idempotente). Public=true para que las URLs devueltas
--    por getPublicUrl sean accesibles sin firma.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-photos',
  'professional-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS en storage.objects ya viene habilitado por defecto en Supabase.
--    Nos limitamos a definir policies específicas para este bucket, sin tocar
--    las de otros buckets que puedan existir.

-- Limpiar policies previas de este bucket por si se re-aplica la migración.
DROP POLICY IF EXISTS "professional_photos_select_public" ON storage.objects;
DROP POLICY IF EXISTS "professional_photos_insert_own"   ON storage.objects;
DROP POLICY IF EXISTS "professional_photos_update_own"   ON storage.objects;
DROP POLICY IF EXISTS "professional_photos_delete_own"   ON storage.objects;

-- SELECT: lectura pública. El bucket es público, así que cualquiera puede
-- obtener la URL firmada/pública y descargar la foto (es la foto de perfil
-- que se muestra en la búsqueda, no hay motivo para restringirla).
CREATE POLICY "professional_photos_select_public"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'professional-photos');

-- INSERT: solo el dueño del path puede crear objetos.
-- La primera carpeta del path debe coincidir con auth.uid().
CREATE POLICY "professional_photos_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'professional-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: solo el dueño del path puede reemplazar sus objetos
-- (el upsert:true del SDK dispara UPDATE si el archivo existe).
CREATE POLICY "professional_photos_update_own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'professional-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'professional-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: solo el dueño puede borrar sus archivos.
CREATE POLICY "professional_photos_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'professional-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
