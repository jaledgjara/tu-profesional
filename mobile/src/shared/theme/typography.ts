import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// FONT FAMILIES
// Nombres exactos como los registra Expo Font Loader.
// Cualquier cambio aquí debe reflejarse en fonts.ts (useAppFonts hook).
// ─────────────────────────────────────────────────────────────────────────────

export const fontFamilies = {
  display: {
    light:     'BricolageGrotesque_300Light',
    regular:   'BricolageGrotesque_400Regular',
    medium:    'BricolageGrotesque_500Medium',
    semiBold:  'BricolageGrotesque_600SemiBold',
    bold:      'BricolageGrotesque_700Bold',
    extraBold: 'BricolageGrotesque_800ExtraBold',
  },
  body: {
    light:    'DMSans_300Light',
    regular:  'DMSans_400Regular',
    medium:   'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    italic:   'DMSans_400Italic',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ESCALA TIPOGRÁFICA
// lineHeight: siempre en puntos absolutos en RN, no ratios.
// letterSpacing: RN usa puntos (CSS usa em — convertir: em × fontSize = RN pts)
// ─────────────────────────────────────────────────────────────────────────────

export const typography = {

  // DISPLAY — splash, onboarding, hero
  display: {
    fontFamily:    fontFamilies.display.extraBold,
    fontSize:      32,
    lineHeight:    38,
    letterSpacing: -1.5,
  },

  // HEADINGS
  h1: {
    fontFamily:    fontFamilies.display.bold,
    fontSize:      26,
    lineHeight:    32,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily:    fontFamilies.display.bold,
    fontSize:      22,
    lineHeight:    28,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily:    fontFamilies.display.bold,
    fontSize:      18,
    lineHeight:    24,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily:    fontFamilies.display.semiBold,
    fontSize:      15,
    lineHeight:    20,
    letterSpacing: -0.2,
  },

  // BODY
  bodyLg: {
    fontFamily:    fontFamilies.body.regular,
    fontSize:      16,
    lineHeight:    26,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily:    fontFamilies.body.regular,
    fontSize:      14,
    lineHeight:    22,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily:    fontFamilies.body.regular,
    fontSize:      13,
    lineHeight:    20,
    letterSpacing: 0,
  },

  // BOTONES — todos los tamaños
  buttonLg: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      16,
    lineHeight:    20,
    letterSpacing: 0.5,
  },
  buttonMd: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      14,
    lineHeight:    18,
    letterSpacing: 0.3,
  },
  buttonSm: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      12,
    lineHeight:    16,
    letterSpacing: 0.2,
  },

  // UI ESPECÍFICO
  inputLabel: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      11,
    lineHeight:    16,
    letterSpacing: 0.8,
    // textTransform: 'uppercase' — aplicar en StyleSheet, no en token
  },
  inputText: {
    fontFamily:    fontFamilies.body.regular,
    fontSize:      15,
    lineHeight:    20,
    letterSpacing: 0,
  },
  caption: {
    fontFamily:    fontFamilies.body.medium,
    fontSize:      12,
    lineHeight:    17,
    letterSpacing: 0,
  },
  overline: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      11,
    lineHeight:    16,
    letterSpacing: 1.5,
    // textTransform: 'uppercase'
  },
  label: {
    fontFamily:    fontFamilies.body.semiBold,
    fontSize:      11,
    lineHeight:    14,
    letterSpacing: 0.3,
  },

  // STATS / MÉTRICAS
  statValue: {
    fontFamily:    fontFamilies.display.bold,
    fontSize:      28,
    lineHeight:    34,
    letterSpacing: -0.8,
  },
  statLabel: {
    fontFamily:    fontFamilies.body.medium,
    fontSize:      10,
    lineHeight:    14,
    letterSpacing: 0.5,
  },

  // RATING
  rating: {
    fontFamily:    fontFamilies.display.semiBold,
    fontSize:      13,
    lineHeight:    16,
    letterSpacing: 0,
  },

  // CITA / QUOTE (pantalla de perfil público)
  quote: {
    fontFamily:    fontFamilies.display.medium,
    fontSize:      17,
    lineHeight:    27,
    letterSpacing: -0.2,
  },

} as const;

export type Typography = typeof typography;
export type TypographyKey = keyof typeof typography;
