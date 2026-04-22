// Catálogo de áreas profesionales para la categoría "Psicología".
//
// Cada área tiene un `id` (slug estable — el valor que va a DB en la columna
// `professional_area text[]`) y un `label` (lo que ve el usuario).
//
// El catálogo está **agrupado** por sección porque con 23+ opciones un listado
// plano es ilegible. El BottomSheet del form renderiza los grupos con header.
//
// Importante:
//   - Los `id` deben coincidir EXACTAMENTE con el CHECK constraint de la
//     migración 0006_add_professional_area.sql. Si agregás un área nueva acá,
//     escribí una migración que extienda el CHECK.
//   - `hint` es una línea corta que se puede mostrar como subtítulo/tooltip
//     en la UI. Es opcional — no todas las áreas lo necesitan.

export interface ProfessionalAreaOption {
  id:    PsychologyAreaId;
  label: string;
  hint?: string;
}

export interface ProfessionalAreaGroup {
  title:   string;
  options: ProfessionalAreaOption[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PSICOLOGÍA — 23 áreas agrupadas
// ─────────────────────────────────────────────────────────────────────────────

export const PSYCHOLOGY_AREAS: ProfessionalAreaGroup[] = [
  {
    title: "Clínica por enfoque teórico",
    options: [
      {
        id:    "psicoanalisis",
        label: "Psicoanálisis",
        hint:  "Inconsciente, defensas e historia temprana. Sesiones de alta frecuencia.",
      },
      {
        id:    "terapia_psicodinamica",
        label: "Terapia psicodinámica",
        hint:  "Deriva del psicoanálisis con mayor foco en el presente y los vínculos actuales.",
      },
      {
        id:    "tcc",
        label: "Terapia cognitivo-conductual (TCC)",
        hint:  "Protocolarizada y orientada a objetivos. Evidencia empírica fuerte.",
      },
      {
        id:    "act",
        label: "Terapia de aceptación y compromiso (ACT)",
        hint:  "Tercera ola de la TCC: mindfulness, aceptación y acción orientada a valores.",
      },
      {
        id:    "emdr",
        label: "EMDR",
        hint:  "Reprocesamiento de memorias traumáticas mediante movimientos oculares bilaterales.",
      },
      {
        id:    "terapia_centrada_persona",
        label: "Terapia centrada en la persona",
        hint:  "Humanista, no directiva. Empatía, congruencia y aceptación incondicional.",
      },
      {
        id:    "terapia_gestalt",
        label: "Terapia Gestalt",
        hint:  "Conciencia del aquí y ahora. Técnicas experienciales como la silla vacía.",
      },
      {
        id:    "terapia_breve_soluciones",
        label: "Terapia breve centrada en soluciones",
        hint:  "Orientada a excepciones y avances concretos. Duración: 3-8 sesiones.",
      },
    ],
  },

  {
    title: "Clínica por población",
    options: [
      {
        id:    "psicologia_infantil",
        label: "Psicología infantil",
        hint:  "Niños 0-12 años. Juego, dibujo y trabajo con la familia.",
      },
      {
        id:    "psicologia_adolescentes",
        label: "Psicología de adolescentes",
        hint:  "Identidad, grupo de pares y separación del núcleo familiar.",
      },
      {
        id:    "terapia_pareja",
        label: "Terapia de pareja",
        hint:  "La pareja como sistema. Patrones de interacción y ciclos de conflicto.",
      },
      {
        id:    "terapia_familiar_sistemica",
        label: "Terapia familiar sistémica",
        hint:  "La familia entera como paciente. Roles, jerarquías y patrones intergeneracionales.",
      },
      {
        id:    "psicologia_adultos_mayores",
        label: "Psicología de adultos mayores",
        hint:  "Gerontología: duelos, deterioro cognitivo y adaptación a la dependencia.",
      },
    ],
  },

  {
    title: "Clínica por área temática",
    options: [
      {
        id:    "trauma",
        label: "Trauma",
        hint:  "Trauma simple y complejo. PTSD, abuso, violencia, negligencia infantil.",
      },
      {
        id:    "psicologia_salud",
        label: "Psicología de la salud",
        hint:  "Respuesta psicológica a enfermedades físicas. Oncología, dolor crónico, adherencia.",
      },
      {
        id:    "trastornos_alimentarios",
        label: "Trastornos alimentarios",
        hint:  "Anorexia, bulimia, atracón, ortorexia. Trabajo interdisciplinario obligatorio.",
      },
      {
        id:    "adicciones",
        label: "Adicciones",
        hint:  "Sustancias y conductuales. Entrevista motivacional y trabajo con el entorno.",
      },
      {
        id:    "terapia_sexual",
        label: "Terapia sexual",
        hint:  "Disfunciones sexuales, identidad y disforia de género. Individual o de pareja.",
      },
    ],
  },

  {
    title: "Neuropsicología",
    options: [
      {
        id:    "neuropsicologia",
        label: "Neuropsicología",
        hint:  "Evaluación y rehabilitación de funciones cognitivas. TDAH, TEA, daño cerebral, demencias.",
      },
    ],
  },

  {
    title: "Aplicada / no clínica",
    options: [
      {
        id:    "psicologia_deportiva",
        label: "Psicología deportiva",
        hint:  "Rendimiento bajo presión. Atletas, equipos, entrenadores, e-sports.",
      },
      {
        id:    "psicologia_organizacional",
        label: "Psicología organizacional",
        hint:  "Selección, liderazgo, clima laboral, gestión del cambio, burnout.",
      },
      {
        id:    "psicologia_forense",
        label: "Psicología forense",
        hint:  "Peritajes judiciales, evaluación de daño psíquico, contextos adversariales.",
      },
      {
        id:    "psicologia_comunitaria",
        label: "Psicología comunitaria",
        hint:  "Salud mental colectiva. Pobreza, emergencias sociales, instituciones vulnerables.",
      },
      {
        id:    "tanatologia",
        label: "Tanatología",
        hint:  "Acompañamiento al final de la vida, muerte y duelo. Cuidados paliativos.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unión discriminada de todos los slugs válidos.
 * Coincide 1:1 con el CHECK constraint de la migración 0006.
 */
export type PsychologyAreaId =
  // Clínica por enfoque teórico
  | "psicoanalisis"
  | "terapia_psicodinamica"
  | "tcc"
  | "act"
  | "emdr"
  | "terapia_centrada_persona"
  | "terapia_gestalt"
  | "terapia_breve_soluciones"
  // Clínica por población
  | "psicologia_infantil"
  | "psicologia_adolescentes"
  | "terapia_pareja"
  | "terapia_familiar_sistemica"
  | "psicologia_adultos_mayores"
  // Clínica por área temática
  | "trauma"
  | "psicologia_salud"
  | "trastornos_alimentarios"
  | "adicciones"
  | "terapia_sexual"
  // Neuropsicología
  | "neuropsicologia"
  // Aplicada / no clínica
  | "psicologia_deportiva"
  | "psicologia_organizacional"
  | "psicologia_forense"
  | "psicologia_comunitaria"
  | "tanatologia";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Lookup rápido por id — útil para renderizar chips ya elegidos. */
export const PSYCHOLOGY_AREA_BY_ID: Record<PsychologyAreaId, ProfessionalAreaOption> =
  Object.fromEntries(
    PSYCHOLOGY_AREAS.flatMap((g) => g.options).map((o) => [o.id, o]),
  ) as Record<PsychologyAreaId, ProfessionalAreaOption>;

/** Flat list — útil para validaciones o tests. */
export const PSYCHOLOGY_AREA_IDS: PsychologyAreaId[] =
  PSYCHOLOGY_AREAS.flatMap((g) => g.options.map((o) => o.id));
