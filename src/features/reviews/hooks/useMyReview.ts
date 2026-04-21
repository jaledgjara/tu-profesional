// Hook: useMyReview
// Capa: hook (orquesta loading/error/data)
// Cliente: usuario final
//
// Lee la reseña que el usuario actual dejó sobre un profesional (o null).
// Se usa para:
//   - Prefill del form "Editar reseña"
//   - Decidir el CTA del perfil: "Escribir" vs "Editar"

import { useState, useEffect, useCallback } from "react";

import { fetchMyReviewFor } from "@/shared/services/reviewsService";
import type { MyReview } from "@/features/reviews/types";
import { strings } from "@/shared/utils/strings";

export interface UseMyReviewResult {
  myReview:  MyReview | null;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useMyReview(
  professionalId: string | undefined,
  enabled: boolean = true,
): UseMyReviewResult {
  const [myReview, setMyReview]   = useState<MyReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fetchKey, setFetchKey]   = useState(0);

  useEffect(() => {
    if (!enabled || !professionalId) {
      setMyReview(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    console.log("[useMyReview] load", { professionalId });
    setIsLoading(true);
    setError(null);

    fetchMyReviewFor(professionalId)
      .then((data) => {
        if (cancelled) return;
        setMyReview(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.log("[useMyReview] error", err);
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [professionalId, enabled, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { myReview, isLoading, error, refetch };
}

// ─────────────────────────────────────────────────────────────────────────────
// 👀 REVIEW NOTES
// ─────────────────────────────────────────────────────────────────────────────
// 1. Patrón más simple que useProfessionalReviews: solo una fuente, sin
//    paginación. Uso `cancelled` flag (no generation counter) porque no hay
//    loadMore que pueda correr en paralelo.
//
// 2. `enabled=false` limpia el state (setMyReview(null)) — útil si el usuario
//    desloguea mientras la screen está montada: el CTA pasa de "Editar" a
//    "Escribir" sin esperar refetch.
//
// 3. Caso "no existe reseña" → `myReview = null`, `error = null`. La screen
//    decide qué mostrar en base a `myReview !== null` (CTA "Editar") vs
//    `myReview === null` (CTA "Escribir").
//
// 4. `refetch` se va a llamar desde la screen después de cada submit exitoso
//    para que el CTA del perfil se actualice ("Escribir" → "Editar").

