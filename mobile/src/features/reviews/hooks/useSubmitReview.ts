// Hook: useSubmitReview
// Capa: hook (mutaciones — create/update/delete)
// Cliente: usuario final
//
// Encapsula las 3 mutaciones y decide create-vs-update según exista una
// reseña previa. Devuelve siempre `{ ok, message? }` para que la screen
// pueda mostrar el Alert sin re-parsear errores.

import { useState, useCallback } from "react";

import {
  createReview,
  updateReview,
  deleteReview,
} from "@/shared/services/reviewsService";
import type {
  CreateReviewInput,
  UpdateReviewInput,
  MyReview,
} from "@/features/reviews/types";
import { strings } from "@/shared/utils/strings";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────────────────────────────────────

export interface SubmitResult {
  ok:       boolean;
  message?: string;        // solo cuando ok=false
}

export interface UseSubmitReviewResult {
  isSubmitting: boolean;
  error:        string | null;
  /**
   * Create-or-update según exista una reseña previa.
   * Si `existing` es null → crea. Si no, actualiza por id.
   */
  submit:       (
    existing: MyReview | null,
    input:    CreateReviewInput,
  ) => Promise<SubmitResult>;
  remove:       (reviewId: string) => Promise<SubmitResult>;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useSubmitReview(): UseSubmitReviewResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const submit = useCallback(
    async (
      existing: MyReview | null,
      input:    CreateReviewInput,
    ): Promise<SubmitResult> => {
      console.log("[useSubmitReview] submit", {
        mode:           existing ? "update" : "create",
        professionalId: input.professionalId,
        rating:         input.rating,
      });

      setIsSubmitting(true);
      setError(null);

      try {
        if (existing) {
          const patch: UpdateReviewInput = {
            rating:  input.rating,
            comment: input.comment ?? null,
          };
          await updateReview(existing.id, patch);
        } else {
          await createReview(input);
        }
        return { ok: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : strings.common.error;
        console.log("[useSubmitReview] submit error", err);
        setError(message);
        return { ok: false, message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const remove = useCallback(async (reviewId: string): Promise<SubmitResult> => {
    console.log("[useSubmitReview] remove", { reviewId });
    setIsSubmitting(true);
    setError(null);

    try {
      await deleteReview(reviewId);
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : strings.common.error;
      console.log("[useSubmitReview] remove error", err);
      setError(message);
      return { ok: false, message };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, error, submit, remove };
}

// ─────────────────────────────────────────────────────────────────────────────
// 👀 REVIEW NOTES
// ─────────────────────────────────────────────────────────────────────────────
// 1. `submit()` decide create vs update según `existing` (MyReview | null).
//    Ventaja: la screen no necesita saber el modo — pasa lo que tiene.
//    El hook encapsula la decisión y acepta la API "declarativa" del form.
//
// 2. `submit()` devuelve `{ ok, message? }` en vez de tirar. Razón: las
//    screens ya tienen que hacer Alert tras submit — si tiran, tienen que
//    try/catch igual. Esta forma simplifica:
//
//      const res = await submit(existing, input);
//      if (res.ok) Alert.alert('¡Gracias!'); else Alert.alert('Error', res.message);
//
//    Si preferís que tire (para error boundaries), cambiá el return type.
//
// 3. `isSubmitting` se toggle también en `remove`. Si la screen tiene dos
//    botones (Guardar + Borrar), ambos se deshabilitan juntos — OK, no
//    queremos concurrent mutations sobre la misma reseña.
//
// 4. No refresca nada automáticamente. La screen debe llamar:
//    - useProfessionalReviews.refetch() para actualizar la lista/stats
//    - useMyReview.refetch() para actualizar el CTA del perfil
//    ...después de un submit/remove exitoso. Acoplamiento intencional:
//    mantiene este hook puro (solo mutaciones).
//
// 5. `existing.id` es la única forma de targetear el update. Si el backend
//    agrega soporte para upsert por (professional_id, reviewer_id), se podría
//    simplificar. Por ahora el id del cliente es necesario.

