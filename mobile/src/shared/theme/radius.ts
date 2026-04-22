// ─────────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// Los radios comunican la personalidad visual.
// Esta app: profesional pero humano → radios medianos-altos.
// Botones: SIEMPRE pill (radius.full).
// Cards: radius.lg (16pt) — más redondeado que el HTML original para
// coincidir con lo que muestran las pantallas de Stitch.
// ─────────────────────────────────────────────────────────────────────────────

export const radius = {
  none:  0,
  xs:    4,
  sm:    6,
  md:    10,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  full:  9999,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// REGLAS POR COMPONENTE — fuente de verdad
// Cambiar un componente aquí lo alinea en todos los places donde se usa.
// ─────────────────────────────────────────────────────────────────────────────

export const componentRadius = {
  // BOTONES — siempre pill en esta app
  button:          radius.full,

  // INPUTS — más redondeado que el HTML (Stitch muestra ~16pt)
  input:           radius.lg,

  // CARDS
  card:            radius.lg,
  cardSmall:       radius.md,

  // BADGES Y CHIPS — siempre pill
  badge:           radius.full,
  filterChip:      radius.full,

  // AVATARES
  avatarCircle:    radius.full,    // cuando es circular (lista, perfil)
  avatarSquare:    radius.xl,      // cuando es cuadrado (logo splash, TP icon)

  // OVERLAYS Y SHEETS
  bottomSheet:     radius['2xl'],  // solo esquinas superiores
  modal:           radius.xl,
  tooltip:         radius.md,

  // ELEMENTOS ESPECIALES
  promoCard:       radius.xl,
  selectableCard:  radius.lg,
  specialtyCard:   radius.lg,
  otpCell:         radius.lg,
  searchBar:       radius.full,
  dropdown:        radius.lg,
  socialInput:     radius.lg,
  metricCard:      radius.lg,
  actionItem:      radius.lg,
  infoSection:     radius.lg,
  reviewCard:      radius.lg,
  statsRow:        radius.lg,
} as const;

export type Radius = typeof radius;
export type RadiusKey = keyof typeof radius;
