-- =============================================================================
-- seed.sql — Datos de prueba locales
-- Corre automáticamente con `supabase db reset`
-- NO correr en producción
-- =============================================================================
-- Crea un psicólogo mock completo para poder testear la app sin registrarte
-- como profesional desde cero. Incluye profile, professionals y user_location.
-- =============================================================================

-- ── 1. Usuario en auth.users ──────────────────────────────────────────────

-- Email: valentina.ruiz@test.local  /  No tiene password → se autentica vía OTP
-- (Mailpit captura el email en local)

DO $$
DECLARE
  v_uid uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
BEGIN

-- Insertar en auth.users si no existe
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token
)
VALUES (
  v_uid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'valentina.ruiz@test.local',
  '', -- sin password: login exclusivamente por OTP
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now(), ''
)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Profile ──────────────────────────────────────────────────────────

INSERT INTO public.profiles (id, role, full_name, phone, created_at, updated_at)
VALUES (
  v_uid,
  'professional',
  'Valentina Ruiz',
  '+54 9 261 412-8834',
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Datos de profesional ─────────────────────────────────────────────

INSERT INTO public.professionals (
  id,
  category,
  dni,
  license,
  description,
  quote,
  quote_author,
  specialty,
  sub_specialties,
  attends_online,
  attends_presencial,
  photo_url,
  is_active,
  created_at, updated_at
)
VALUES (
  v_uid,
  'psychology',
  '28.450.771',
  'MN 85.342',
  'Psicóloga clínica con 12 años de experiencia, especializada en adultos y parejas. Mi enfoque integra la terapia cognitivo-conductual con herramientas de mindfulness para trabajar ansiedad, vínculos relacionales y transiciones vitales. Creo en construir un espacio de confianza donde cada persona pueda explorar su historia y encontrar nuevas formas de relacionarse consigo misma.',
  'No se trata de deshacerse del miedo, sino de aprender a caminar con él.',
  'Pema Chödrön',
  'Psicología Clínica',
  ARRAY['Ansiedad y estrés', 'Terapia de pareja', 'Duelo y pérdida', 'Mindfulness'],
  true,   -- attends_online
  true,   -- attends_presencial
  null,   -- photo_url: null → la app muestra avatar generado
  true,   -- is_active
  now(), now()
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Ubicación (Centro Mendoza) ───────────────────────────────────────

INSERT INTO public.user_locations (
  user_id,
  street, number, floor, apartment,
  postal_code, city, province, country,
  geom,
  updated_at
)
VALUES (
  v_uid,
  'San Martín', '1245', '3', 'B',
  'M5500', 'Mendoza', 'Mendoza', 'Argentina',
  ST_SetSRID(ST_MakePoint(-68.8272, -32.8908), 4326)::geography,
  now()
)
ON CONFLICT (user_id) DO NOTHING;

END $$;
