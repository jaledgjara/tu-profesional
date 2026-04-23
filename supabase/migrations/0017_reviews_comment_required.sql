-- =============================================================================
-- 0017_reviews_comment_required.sql — comment obligatorio y no vacío
-- =============================================================================
-- Contexto: desde el lado UI ya exigimos que el usuario escriba un comentario
-- para publicar una reseña (aporta valor a la comunidad, no solo puntaje).
-- Esta migración traslada la regla a la DB como defensa en profundidad —
-- aunque alguien bypassee el cliente (SDK directo, script, etc.), la DB
-- rechaza reseñas sin texto real.
--
-- Cambios:
--   1. Backfill: elimina filas históricas con comment null o vacío (tras trim).
--   2. Drop del CHECK viejo (`reviews_comment_len`).
--   3. SET NOT NULL en `comment`.
--   4. Nuevo CHECK combinado: no vacío (tras trim) + length ≤ 1000.
-- =============================================================================

-- 1) Backfill. Pre-launch: no hay datos productivos, pero por higiene cubrimos
--    el caso de local/staging con data de prueba inconsistente.
delete from public.reviews
where comment is null
   or char_length(trim(comment)) = 0;

-- 2) Drop del CHECK viejo.
alter table public.reviews drop constraint reviews_comment_len;

-- 3) SET NOT NULL.
alter table public.reviews alter column comment set not null;

-- 4) Nuevo CHECK — reemplaza al viejo.
alter table public.reviews
  add constraint reviews_comment_required_and_len
  check (char_length(trim(comment)) > 0 and char_length(comment) <= 1000);

-- Nota: la vista `reviews_public` proyecta `comment` y hereda la semántica
-- NOT NULL + trim()>0 automáticamente (no hace falta recrear la vista).
