// ─────────────────────────────────────────────────────────────────────────────
// GRID BASE: 4px
// Todos los valores de margin/padding/gap son múltiplos de 4.
// "Números mágicos" (padding: 13) son deuda visual que se acumula.
// ─────────────────────────────────────────────────────────────────────────────

export const spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  9:    36,
  10:   40,
  11:   44,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
} as const;

// Helper para cálculos ad-hoc dentro de StyleSheet
export const grid = (n: number): number => n * 4;

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES DE LAYOUT SEMÁNTICAS
// Estos valores son la fuente de verdad de la app.
// Cambiar uno aquí lo propaga a todos los componentes que lo usan.
// ─────────────────────────────────────────────────────────────────────────────

export const layout = {
  // Padding horizontal de pantalla (de borde a borde del contenido)
  screenPaddingH:  spacing[4],    // 16pt

  // Padding vertical de pantalla (top del contenido, no del header)
  screenPaddingV:  spacing[6],    // 24pt

  // Padding interno de cards
  cardPadding:     spacing[4],    // 16pt

  // Gap entre cards en una lista
  cardGap:         spacing[3],    // 12pt

  // Gap entre secciones de pantalla
  sectionGap:      spacing[6],    // 24pt

  // Gap entre inputs en un formulario
  inputGap:        spacing[3],    // 12pt

  // Gap entre label e input
  labelGap:        spacing[1.5],  // 6pt

  // Altura del AppHeader
  headerHeight:    56,

  // Altura del BottomTabBar (sin safe area — el safe area se agrega dinámicamente)
  tabBarHeight:    49,

  // Alturas de botones (touch target mínimo Apple HIG: 44pt)
  buttonHeightLg:  52,
  buttonHeightMd:  44,
  buttonHeightSm:  36,

  // Touch target mínimo absoluto (Apple HIG / Material Design)
  touchTargetMin:  44,

  // Ancho máximo de contenido (para screens en tablet)
  maxContentWidth: 428,

  // Altura del área sticky de CTAs al fondo de formularios
  stickyBarHeight: 84,
} as const;

export type Spacing = typeof spacing;
export type SpacingKey = keyof typeof spacing;
