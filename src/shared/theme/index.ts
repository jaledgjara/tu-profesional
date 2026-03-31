// ─────────────────────────────────────────────────────────────────────────────
// BARREL EXPORT DEL SISTEMA DE TOKENS
//
// Uso en componentes:
//   import { colors, spacing, typography, getShadow } from '@/shared/theme';
//
// El alias '@/' requiere configurar path alias en tsconfig.json y babel.config.js
// con babel-plugin-module-resolver.
// ─────────────────────────────────────────────────────────────────────────────

export { colors, palette } from './colors';
export type { Colors } from './colors';

export { fontFamilies, typography } from './typography';
export type { Typography, TypographyKey } from './typography';

export { spacing, grid, layout } from './spacing';
export type { Spacing, SpacingKey } from './spacing';

export { radius, componentRadius } from './radius';
export type { Radius, RadiusKey } from './radius';

export { getShadow, shadows } from './shadows';
export type { ShadowLevel } from './shadows';

export { duration, easings, animationRules } from './animation';
export type { AnimationRule } from './animation';

export { zIndex } from './zIndex';
export type { ZIndexKey } from './zIndex';
