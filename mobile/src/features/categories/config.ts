// Configuración visual de cada categoría: color de fondo, ícono (Ionicons),
// color del ícono y cantidad de profesionales en Mendoza (mock).
// Los colores usan solo tokens de colors.* — nunca hex hardcodeado.

import { PSYCHOLOGY_CATEGORIES } from './types';
import type { PsychologyCategoryId } from './types';
import { colors } from '@/shared/theme';

interface CategoryVisual {
  backgroundColor: string;
  iconName:        string;  // nombre de Ionicons — https://icons.expo.fyi/Index
  iconColor:       string;
  count:           number;  // mock — reemplazar con query Supabase COUNT por categoría
}

const CATEGORY_VISUAL: Record<PsychologyCategoryId, CategoryVisual> = {
  todos:        { backgroundColor: colors.background.subtle,    iconName: 'apps-outline',     iconColor: colors.text.secondary,   count: 48 },
  ansiedad:     { backgroundColor: colors.brand.primaryLight,   iconName: 'pulse-outline',    iconColor: colors.brand.primary,    count: 18 },
  depresion:    { backgroundColor: colors.brand.accentLight,    iconName: 'cloud-outline',    iconColor: colors.brand.accent,     count: 15 },
  pareja:       { backgroundColor: colors.status.errorBg,       iconName: 'heart-outline',    iconColor: colors.status.error,     count: 12 },
  ninos:        { backgroundColor: colors.status.warningBg,     iconName: 'happy-outline',    iconColor: colors.status.warning,   count: 9  },
  adolescentes: { backgroundColor: colors.palette.blue100,      iconName: 'people-outline',   iconColor: colors.brand.primary,    count: 11 },
  duelo:        { backgroundColor: colors.palette.sand200,      iconName: 'leaf-outline',     iconColor: colors.text.secondary,   count: 8  },
  trauma:       { backgroundColor: colors.palette.jade100,      iconName: 'shield-outline',   iconColor: colors.brand.accentDark, count: 10 },
  tcc:          { backgroundColor: colors.brand.primaryLight,   iconName: 'bulb-outline',     iconColor: colors.brand.primaryDark, count: 16 },
  online:       { backgroundColor: colors.status.successBg,     iconName: 'videocam-outline', iconColor: colors.status.success,   count: 22 },
};

export const CATEGORIES_CONFIG = PSYCHOLOGY_CATEGORIES.map((cat) => ({
  ...cat,
  ...CATEGORY_VISUAL[cat.id],
}));

export type CategoryConfig = (typeof CATEGORIES_CONFIG)[number];
