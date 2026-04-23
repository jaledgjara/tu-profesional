// Tipos de la feature `reviews`.
//
// Hay DOS formas de reseña:
//   - Review:   la que leen todos los clientes vía vista `reviews_public`.
//               NO expone reviewer_id (anonimato estructural).
//   - MyReview: la que lee el propio autor vía RPC `get_my_review_for`.
//               Incluye reviewer_id y updated_at para el form de edición.
//
// Los mappers viven en `reviewsService.ts` (snake_case DB → camelCase cliente).

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — pública / anónima
// ─────────────────────────────────────────────────────────────────────────────

export interface Review {
  id:             string;
  professionalId: string;
  rating:         number;         // 1-5
  comment:        string | null;  // null cuando el autor no dejó texto
  createdAt:      string;         // ISO timestamp
}

export interface ReviewStats {
  avgRating:   number;   // 0 cuando no hay reseñas (no null — simplifica UI)
  reviewCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — privada (solo el propio autor)
// ─────────────────────────────────────────────────────────────────────────────

export interface MyReview extends Review {
  reviewerId: string;
  updatedAt:  string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateReviewInput {
  professionalId: string;
  rating:         number;
  comment?:       string | null;   // opcional. null equivale a "sin texto".
}

export interface UpdateReviewInput {
  rating?:  number;
  comment?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 👀 REVIEW NOTES (borrar antes de merge a main si querés)
// ─────────────────────────────────────────────────────────────────────────────
// 1. `Review` NO tiene `reviewerId` a propósito — viene de la vista anónima
//    `reviews_public`. Si alguna UI necesita nombre/avatar del autor, es un bug
//    de diseño: romperíamos el anonimato. Usar `MyReview` solo para el autor.
// 2. `avgRating: number` en `ReviewStats` es siempre un número (no null). El
//    service devuelve 0 cuando no hay reseñas. Simplifica la UI (no hace falta
//    chequear nullish antes de .toFixed()).
// 3. `comment?` en `CreateReviewInput` es opcional (→ null en DB). El CHECK de
//    DB valida length ≤ 1000 — no validamos en el cliente (fuente de verdad es
//    la DB, acá sobra).

