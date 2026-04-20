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
