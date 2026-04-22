// Mapeo visual de las áreas profesionales — íconos de Ionicons y paleta de
// color por grupo. Se consume desde la pantalla de búsqueda para renderizar
// las cards agrupadas por sección.
//
// Criterio de diseño:
//   - Ícono elegido por **metáfora directa**, no por literalidad: "terapia de
//     pareja" → corazón; "neuropsicología" → chip; "forense" → martillo de juez.
//   - Cuando no hay un ícono que represente el área con claridad, el campo
//     `initial` permite renderizar una letra como fallback (ver SpecialtyCard
//     en la pantalla). Hoy ningún área usa fallback — está contemplado para
//     futuras áreas en otras categorías (ej. nutrición, kinesiología).
//   - Los 5 grupos comparten una misma paleta interna. Esto cohesiona visualmente
//     la sección con sus cards y le da al scroll una jerarquía clara.
//
// Catálogo de íconos disponibles: https://icons.expo.fyi/Index
//
// Ids coinciden 1:1 con `PsychologyAreaId` y con el CHECK de la migración 0006.

import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

import { colors } from "@/shared/theme";
import {
  PSYCHOLOGY_AREAS,
  type PsychologyAreaId,
} from "./professionalAreas";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export interface AreaVisual {
  iconName:        IoniconName;
  /** Fallback para cuando un área no tiene un ícono que la represente bien. */
  initial?:        string;
  iconColor:       string;
  backgroundColor: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// PALETA POR GRUPO — usa solo tokens semánticos (nunca hex hardcodeado)
// ─────────────────────────────────────────────────────────────────────────────

interface GroupPalette { bg: string; fg: string }

const GROUP_PALETTE: Record<string, GroupPalette> = {
  "Clínica por enfoque teórico": {
    bg: colors.brand.primaryLight,
    fg: colors.brand.primary,
  },
  "Clínica por población": {
    bg: colors.brand.accentLight,
    fg: colors.brand.accentDark,
  },
  "Clínica por área temática": {
    bg: colors.status.warningBg,
    fg: colors.status.warning,
  },
  "Neuropsicología": {
    bg: colors.palette.blue100,
    fg: colors.brand.primaryDark,
  },
  "Aplicada / no clínica": {
    bg: colors.palette.sand200,
    fg: colors.text.secondary,
  },
};

const DEFAULT_PALETTE: GroupPalette = {
  bg: colors.background.subtle,
  fg: colors.text.primary,
};

// ─────────────────────────────────────────────────────────────────────────────
// ÍCONOS POR ÁREA
// ─────────────────────────────────────────────────────────────────────────────

type AreaIcon = { iconName: IoniconName; initial?: string };

const AREA_ICON: Record<PsychologyAreaId, AreaIcon> = {
  // Clínica por enfoque teórico ────────────────────────────────────────────────
  psicoanalisis:            { iconName: "infinite-outline" },      // inconsciente sin fondo
  terapia_psicodinamica:    { iconName: "people-circle-outline" }, // vínculos actuales
  tcc:                      { iconName: "construct-outline" },     // protocolos y herramientas
  act:                      { iconName: "compass-outline" },       // acción orientada a valores
  emdr:                     { iconName: "eye-outline" },           // movimientos oculares
  terapia_centrada_persona: { iconName: "person-outline" },        // la persona como centro
  terapia_gestalt:          { iconName: "color-palette-outline" }, // forma / percepción
  terapia_breve_soluciones: { iconName: "flash-outline" },         // pocas sesiones, foco

  // Clínica por población ──────────────────────────────────────────────────────
  psicologia_infantil:        { iconName: "happy-outline" },
  psicologia_adolescentes:    { iconName: "people-outline" },
  terapia_pareja:             { iconName: "heart-outline" },
  terapia_familiar_sistemica: { iconName: "home-outline" },
  psicologia_adultos_mayores: { iconName: "time-outline" },

  // Clínica por área temática ──────────────────────────────────────────────────
  trauma:                  { iconName: "shield-outline" },
  psicologia_salud:        { iconName: "medkit-outline" },
  trastornos_alimentarios: { iconName: "restaurant-outline" },
  adicciones:              { iconName: "ban-outline" },
  terapia_sexual:          { iconName: "flower-outline" },

  // Neuropsicología ────────────────────────────────────────────────────────────
  neuropsicologia: { iconName: "hardware-chip-outline" },

  // Aplicada / no clínica ──────────────────────────────────────────────────────
  psicologia_deportiva:      { iconName: "fitness-outline" },
  psicologia_organizacional: { iconName: "business-outline" },
  psicologia_forense:        { iconName: "hammer-outline" },
  psicologia_comunitaria:    { iconName: "earth-outline" },
  tanatologia:               { iconName: "leaf-outline" },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT — sections consumibles por SearchScreen
// ─────────────────────────────────────────────────────────────────────────────

export interface AreaCard {
  id:              PsychologyAreaId;
  label:           string;
  hint?:           string;
  iconName:        IoniconName;
  initial?:        string;
  iconColor:       string;
  backgroundColor: string;
}

export interface AreaSection {
  title: string;
  data:  AreaCard[];
}

export const PSYCHOLOGY_AREA_SECTIONS: AreaSection[] = PSYCHOLOGY_AREAS.map(
  (group) => {
    const palette = GROUP_PALETTE[group.title] ?? DEFAULT_PALETTE;
    return {
      title: group.title,
      data:  group.options.map((opt) => {
        const icon = AREA_ICON[opt.id];
        return {
          id:              opt.id,
          label:           opt.label,
          hint:            opt.hint,
          iconName:        icon.iconName,
          initial:         icon.initial,
          iconColor:       palette.fg,
          backgroundColor: palette.bg,
        };
      }),
    };
  },
);
