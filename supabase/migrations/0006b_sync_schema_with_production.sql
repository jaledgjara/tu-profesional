-- 0006b — Sincronizar schema local con producción
-- Columnas que fueron agregadas directo en el Dashboard de Supabase
-- y nunca se crearon como migraciones. Sin esto, CI falla porque
-- supabase start solo aplica migrations del repo.

-- ── professionals: columnas faltantes ─────────────────────────────────────

-- full_name fue movido de profiles a professionals en produccion
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS phone text;

-- Redes sociales
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS social_whatsapp text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS social_instagram text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS social_linkedin text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS social_twitter text;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS social_tiktok text;

-- ── profiles: columna email (agregada en produccion) ──────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
