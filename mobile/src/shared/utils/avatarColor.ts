// ─────────────────────────────────────────────────────────────────────────────
// UTILIDAD DE AVATAR
//
// La imagen de perfil real es OBLIGATORIA en el onboarding del profesional
// y se incentiva en el del usuario. Estas utilidades sirven para el estado
// de carga o cuando la imagen falla — NO como sustituto permanente.
//
// El color determinístico (hash) garantiza que el mismo nombre siempre
// produce el mismo color en cualquier dispositivo y sesión, sin guardar
// nada en la base de datos.
// ─────────────────────────────────────────────────────────────────────────────

import { colors } from '@/shared/theme';

const AVATAR_PALETTE = [
  colors.palette.blue500,    // #2E6CC8
  colors.palette.blue700,    // #1E4785
  colors.palette.blue800,    // #1A3563
  colors.palette.jade600,    // #228A82
  colors.palette.jade700,    // #1A6B65
] as const;

/**
 * Deriva un color de fondo para el avatar a partir del nombre.
 * Determinístico: el mismo nombre siempre da el mismo color.
 */
export function getAvatarBgColor(name: string): string {
  if (!name) return AVATAR_PALETTE[0];
  const hash = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

// Prefijos de título profesional a ignorar al calcular iniciales
const TITLE_PREFIXES = new Set([
  'lic.', 'dr.', 'dra.', 'mg.', 'prof.', 'esp.', 'lic', 'dr', 'dra',
]);

/**
 * Extrae las iniciales de un nombre completo.
 * Ignora prefijos de título (Lic., Dr., etc.)
 * "Lic. Martina López" → "ML"
 * "Juan" → "J"
 */
export function getInitials(fullName: string): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const filtered = parts.filter(
    (p) => !TITLE_PREFIXES.has(p.toLowerCase())
  );
  if (filtered.length === 0) return '?';
  if (filtered.length === 1) return filtered[0][0].toUpperCase();
  return (filtered[0][0] + filtered[filtered.length - 1][0]).toUpperCase();
}
