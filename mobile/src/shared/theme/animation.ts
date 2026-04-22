import { Easing } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// DURACIONES (ms)
// La consistencia en timing es lo que hace que una app se sienta "pulida".
// Cada categoría de interacción tiene su duración, no se improvisa.
// ─────────────────────────────────────────────────────────────────────────────

export const duration = {
  instant:  0,     // cambios sin animación (casos muy específicos)
  fast:     150,   // micro-interacciones: tap de botón, toggle, chip
  normal:   250,   // cambios de estado: input focus, card press
  slow:     350,   // entradas de elementos: bottom sheet, modal
  slower:   500,   // transiciones de contenido: skeleton → datos
  slowest:  700,   // animaciones de onboarding, splash
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// EASINGS
// Curvas de aceleración para Animated API de React Native.
// ─────────────────────────────────────────────────────────────────────────────

export const easings = {
  // Entrada de elementos (frenan al llegar) — el más usado
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1.0),

  // Salida de elementos (aceleran al irse)
  easeIn: Easing.bezier(0.4, 0.0, 1.0, 1.0),

  // Cambios de estado internos
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1.0),

  // Feedback con rebote ligero (confirmaciones positivas)
  spring: Easing.bezier(0.34, 1.56, 0.64, 1.0),

  // Linear — solo para shimmer/skeleton
  linear: Easing.linear,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// REGLAS POR INTERACCIÓN
// Esto previene decisiones ad-hoc en cada componente.
// Uso: const { duration: d, easing: e } = animationRules.buttonPress
// ─────────────────────────────────────────────────────────────────────────────

export const animationRules = {
  buttonPress:        { duration: duration.fast,    easing: easings.easeOut },
  buttonRelease:      { duration: duration.fast,    easing: easings.easeIn },
  inputFocus:         { duration: duration.fast,    easing: easings.easeOut },
  inputBlur:          { duration: duration.fast,    easing: easings.easeIn },
  cardPress:          { duration: duration.normal,  easing: easings.easeOut },
  chipSelect:         { duration: duration.fast,    easing: easings.spring },
  bottomSheetOpen:    { duration: duration.slow,    easing: easings.easeOut },
  bottomSheetClose:   { duration: duration.normal,  easing: easings.easeIn },
  modalOpen:          { duration: duration.slow,    easing: easings.easeOut },
  modalClose:         { duration: duration.normal,  easing: easings.easeIn },
  tabChange:          { duration: duration.fast,    easing: easings.easeInOut },
  skeletonFade:       { duration: duration.slower,  easing: easings.easeOut },
  heartToggle:        { duration: duration.fast,    easing: easings.spring },
  toggleSwitch:       { duration: duration.fast,    easing: easings.spring },
  screenEnter:        { duration: duration.slow,    easing: easings.easeOut },
  avatarImageLoad:    { duration: duration.slower,  easing: easings.easeOut },
} as const;

export type AnimationRule = keyof typeof animationRules;
