// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE FORMATEO
// Funciones puras de formateo que se usan en múltiples features.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formatea la distancia desde PostGIS (metros) a string legible.
 * 2400m → "2.4 km"
 * 800m  → "800 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Formatea el rating con su conteo de reseñas.
 * (4.9, 38) → "★ 4.9 (38)"
 */
export function formatRating(rating: number, count?: number): string {
  const ratingStr = `★ ${rating.toFixed(1)}`;
  if (count !== undefined) return `${ratingStr} (${count})`;
  return ratingStr;
}

/**
 * Formatea años de experiencia.
 * 8 → "8 años de exp."
 */
export function formatExperience(years: number): string {
  return `${years} ${years === 1 ? 'año' : 'años'} de exp.`;
}

/**
 * Formatea la fecha de una reseña en formato relativo.
 * Retorna strings como "Hace 2 semanas", "Hace 1 mes"
 */
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7)    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  if (diffDays < 30)   return `Hace ${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'semana' : 'semanas'}`;
  if (diffDays < 365)  return `Hace ${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? 'mes' : 'meses'}`;
  return `Hace ${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? 'año' : 'años'}`;
}

/**
 * Formatea número de teléfono argentino para WhatsApp deeplink.
 * "+54 9 11 1234-5678" → "5491112345678"
 */
export function formatWhatsAppNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Construye el URL de WhatsApp deeplink.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const number = formatWhatsAppNumber(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `whatsapp://send?phone=${number}${encodedMessage ? `&text=${encodedMessage}` : ''}`;
}

/**
 * Convierte el identificador interno de categoría a label en español.
 * "psychology" → "Psicología"
 * Cuando se sumen categorías nuevas, mapearlas acá.
 */
const CATEGORY_LABELS: Record<string, string> = {
  psychology: "Psicología",
};

export function formatCategory(category: string | null | undefined): string {
  if (!category) return "";
  return CATEGORY_LABELS[category] ?? category;
}
