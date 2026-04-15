-- 0006_add_professional_area.sql
-- Agrega `professional_area` a la tabla `professionals`.
--
-- Diseño:
--   - Columna genérica (no "psychology_area") para que cuando se sumen otras
--     categorías (ej. nutrición) reusemos la misma columna; el catálogo de
--     valores válidos vive en el cliente por categoría.
--   - text[] porque un profesional puede trabajar en múltiples áreas.
--   - NOT NULL DEFAULT '{}' → los perfiles existentes quedan con array vacío,
--     no NULL. Lectura predecible: siempre podés hacer `.length`.
--   - CHECK constraint con todos los slugs actuales del catálogo de psicología.
--     Cuando sumemos otra categoría, una nueva migración extiende el CHECK.
--   - Índice GIN para habilitar `professional_area && ARRAY['tcc']` rápido
--     cuando conectemos el filtro del home (Fase 2).

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS professional_area text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.professionals
  DROP CONSTRAINT IF EXISTS professionals_professional_area_check;

ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_professional_area_check
  CHECK (
    professional_area <@ ARRAY[
      -- Clínica por enfoque teórico
      'psicoanalisis',
      'terapia_psicodinamica',
      'tcc',
      'act',
      'emdr',
      'terapia_centrada_persona',
      'terapia_gestalt',
      'terapia_breve_soluciones',

      -- Clínica por población
      'psicologia_infantil',
      'psicologia_adolescentes',
      'terapia_pareja',
      'terapia_familiar_sistemica',
      'psicologia_adultos_mayores',

      -- Clínica por área temática
      'trauma',
      'psicologia_salud',
      'trastornos_alimentarios',
      'adicciones',
      'terapia_sexual',

      -- Neuropsicología
      'neuropsicologia',

      -- Aplicada / no clínica
      'psicologia_deportiva',
      'psicologia_organizacional',
      'psicologia_forense',
      'psicologia_comunitaria',
      'tanatologia'
    ]::text[]
  );

CREATE INDEX IF NOT EXISTS professionals_professional_area_gin_idx
  ON public.professionals USING GIN (professional_area);

COMMENT ON COLUMN public.professionals.professional_area IS
  'Áreas profesionales (multi-select). Catálogo en cliente por categoría. '
  'Para psicología: ver src/features/categories/professionalAreas.ts.';
