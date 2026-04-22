// ─────────────────────────────────────────────────────────────────────────────
// PALETA PRIMITIVA
// Valores raw. Los componentes NUNCA los referencian directamente.
// Toda referencia de color en componentes va a través de `colors.*`
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  // Primary Blue — identidad de marca
  blue50:  '#EEF4FD',
  blue100: '#DDEAFC',
  blue200: '#BAD5F8',
  blue300: '#7EB0F0',
  blue400: '#4A88E0',
  blue500: '#2E6CC8',   // ★ primary brand
  blue600: '#2558A8',
  blue700: '#1E4785',
  blue800: '#1A3563',
  blue900: '#112347',
  blue950: '#0C1B3A',

  // Accent Jade — disponibilidad, confirmación, salud
  jade50:  '#E8FAF8',
  jade100: '#D0F2EF',
  jade300: '#7EDBD4',
  jade400: '#3DC4BA',
  jade500: '#2CA89E',   // ★ accent
  jade600: '#228A82',
  jade700: '#1A6B65',

  // Neutral Sand — warm neutrals, no gris puro
  sand50:  '#F7F5F2',
  sand100: '#EFEDE9',
  sand200: '#DDD9D4',
  sand300: '#C8C3BC',
  sand400: '#AAA49C',
  sand500: '#8E877D',
  sand600: '#716A62',
  sand700: '#56504A',
  sand800: '#3D3830',
  sand900: '#27231C',

  // Absolutos
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',

  // Semánticos funcionales
  success:   '#16A34A',
  successBg: '#DCFCE7',
  warning:   '#D97706',
  warningBg: '#FEF3C7',
  error:     '#DC2626',
  errorBg:   '#FEE2E2',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS SEMÁNTICOS
// Lo que los componentes usan. Cuando haya dark mode, solo cambia esto.
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {

  // MARCA
  brand: {
    primary:      palette.blue500,
    primaryHover: palette.blue600,
    primaryDark:  palette.blue800,
    primaryLight: palette.blue50,
    accent:       palette.jade500,
    accentDark:   palette.jade700,
    accentLight:  palette.jade50,
  },

  // FONDOS DE PANTALLA Y SUPERFICIE
  background: {
    screen:   palette.sand50,    // fondo de todas las pantallas
    card:     palette.white,     // cards, modals, sheets
    subtle:   palette.sand100,   // secciones secundarias, separadores
    inverse:  palette.blue900,   // headers oscuros (experience profesional)
    brand:    palette.blue500,   // header azul (home usuario)
    promo:    palette.blue800,   // PromoCard, banners upgrade
  },

  // TEXTO
  text: {
    primary:   palette.sand900,  // texto principal
    secondary: palette.sand600,  // subtítulos, metadata
    tertiary:  palette.sand400,  // placeholders, deshabilitado
    inverse:   palette.white,    // sobre fondos oscuros
    brand:     palette.blue500,  // links, "Ver todos", acciones secundarias
    brandDark: palette.blue800,  // títulos sobre fondo claro
    accent:    palette.jade600,  // texto jade (especialidad en card)
    danger:    palette.error,    // "Cerrar sesión", acciones destructivas
  },

  // BORDES
  border: {
    default:  palette.sand200,   // inputs idle, cards con borde
    subtle:   palette.sand100,   // separadores internos
    strong:   palette.sand300,   // hover, énfasis
    focus:    palette.blue500,   // input focused
    brand:    palette.blue200,   // elementos de marca
    error:    palette.error,
    card:     palette.sand200,
  },

  // ICONOS
  icon: {
    default:   palette.sand500,
    active:    palette.blue500,
    inactive:  palette.sand400,
    inverse:   palette.white,
    brand:     palette.blue500,
    accent:    palette.jade500,
    danger:    palette.error,
  },

  // ESTADOS SEMÁNTICOS
  status: {
    success:    palette.success,
    successBg:  palette.successBg,
    warning:    palette.warning,
    warningBg:  palette.warningBg,
    error:      palette.error,
    errorBg:    palette.errorBg,
  },

  // OVERLAYS
  overlay: {
    light:  'rgba(0,0,0,0.04)',
    medium: 'rgba(0,0,0,0.32)',
    dark:   'rgba(0,0,0,0.64)',
    brand:  'rgba(46,108,200,0.12)',
  },

  // AVATAR PLACEHOLDER (cuando no hay foto — gradiente expresado como colores)
  // El avatar con foto real siempre tiene prioridad sobre estos valores.
  avatarFallback: {
    bg:   palette.blue500,
    text: palette.white,
  },

  // RE-EXPORTAR PALETTE para casos edge (ej: gradientes en LinearGradient)
  palette,

} as const;

export type Colors = typeof colors;
