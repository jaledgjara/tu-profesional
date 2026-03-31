import { Platform, ViewStyle } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE SOMBRAS
//
// React Native tiene dos sistemas incompatibles:
//   iOS   → shadowColor + shadowOffset + shadowOpacity + shadowRadius
//   Android → elevation (número entero, material shadow)
//
// Las sombras están tonalizadas en azul-marca (#1A3563), no negro puro.
// Esto es una decisión de identidad: produce un resultado más refinado
// y cohesivo con la paleta. Negro puro en sombras hace que las cards
// "floten" genéricamente. Azulado hace que pertenezcan al sistema.
// ─────────────────────────────────────────────────────────────────────────────

const SHADOW_COLOR = '#1A3563'; // blue-800
const BRAND_SHADOW_COLOR = '#2E6CC8'; // blue-500 — para CTAs

type IOSShadow = {
  shadowColor:   string;
  shadowOffset:  { width: number; height: number };
  shadowOpacity: number;
  shadowRadius:  number;
};

type AndroidShadow = {
  elevation: number;
};

type ShadowDefinition = IOSShadow & AndroidShadow;

const shadowDefinitions: Record<string, ShadowDefinition> = {
  none: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius:  0,
    elevation:     0,
  },
  xs: {
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  2,
    elevation:     1,
  },
  sm: {
    // Cards estándar: ProfessionalCard, InfoSection, MetricCard
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     2,
  },
  md: {
    // Cards seleccionadas, estados hover
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  20,
    elevation:     4,
  },
  lg: {
    // BottomSheet, Modal, elementos flotantes
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius:  40,
    elevation:     8,
  },
  xl: {
    // Casos excepcionales: modals muy prominentes
    shadowColor:   SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius:  60,
    elevation:     12,
  },
  brand: {
    // Button primary, FAB — sombra azul saturada
    shadowColor:   BRAND_SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius:  20,
    elevation:     6,
  },
  brandSubtle: {
    // Input focused ring
    shadowColor:   BRAND_SHADOW_COLOR,
    shadowOffset:  { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius:  0,
    elevation:     0,
    // Nota: el "ring" de focus se implementa con borderWidth + borderColor,
    // no con sombra, porque RN no soporta box-shadow spread.
    // Esta entrada existe para referencia de diseño.
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER DE PLATAFORMA
// Uso: style={[styles.card, getShadow('sm')]}
// ─────────────────────────────────────────────────────────────────────────────

export function getShadow(
  level: keyof typeof shadowDefinitions
): ViewStyle {
  const def = shadowDefinitions[level];

  if (Platform.OS === 'android') {
    return { elevation: def.elevation };
  }

  return {
    shadowColor:   def.shadowColor,
    shadowOffset:  def.shadowOffset,
    shadowOpacity: def.shadowOpacity,
    shadowRadius:  def.shadowRadius,
  };
}

// Para acceder a las definiciones sin aplicar el helper de plataforma
export const shadows = shadowDefinitions;
export type ShadowLevel = keyof typeof shadowDefinitions;
