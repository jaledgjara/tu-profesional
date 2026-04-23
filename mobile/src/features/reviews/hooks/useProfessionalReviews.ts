// Hook: useProfessionalReviews
// Capa: hook (orquesta loading/error/data + paginación)
// Cliente: usuario final
//
// Carga en paralelo la lista de reseñas anónimas (reviews_public) y los
// stats agregados (avg + count) para un profesional.
//
// Paginación: offset-based, simple. No usamos keyset porque los volúmenes
// esperados son bajos (< 100 reseñas por pro en el mediano plazo). Si
// crece, migrar a cursor (created_at, id) como en professionalSearch.

import { useState, useEffect, useCallback, useRef } from "react";

import {
  fetchProfessionalReviews,
  fetchProfessionalReviewStats,
} from "@/shared/services/reviewsService";
import type { Review, ReviewStats } from "@/features/reviews/types";
import { strings } from "@/shared/utils/strings";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────────────────────────────────────

export interface UseProfessionalReviewsOptions {
  /** Cantidad inicial + tamaño de cada "siguiente página". Default 20. */
  limit?: number;
  /** Cuando false, el hook no fetchea. Default true. */
  enabled?: boolean;
}

export interface UseProfessionalReviewsResult {
  reviews:       Review[];
  stats:         ReviewStats | null;
  isLoading:     boolean;   // primera carga
  isLoadingMore: boolean;   // append
  error:         string | null;
  hasMore:       boolean;
  loadMore:      () => void;
  refetch:       () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useProfessionalReviews(
  professionalId: string | undefined,
  options: UseProfessionalReviewsOptions = {},
): UseProfessionalReviewsResult {
  const { limit = 20, enabled = true } = options;

  const [reviews, setReviews]             = useState<Review[]>([]);
  const [stats, setStats]                 = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(true);
  const [fetchKey, setFetchKey]           = useState(0);

  // Offset actual (cantidad ya cargada). Se usa para pedir la siguiente página.
  const offsetRef = useRef(0);

  // Generation counter: descarta respuestas stale si el hook se resetea.
  const generationRef  = useRef(0);
  const loadingMoreRef = useRef(false);

  // ── Primera carga / reset ──────────────────────────────────────────────
  useEffect(() => {
    const gen = ++generationRef.current;
    offsetRef.current      = 0;
    loadingMoreRef.current = false;
    setReviews([]);
    setStats(null);
    setIsLoadingMore(false);
    setError(null);
    setHasMore(true);

    if (!enabled || !professionalId) {
      setIsLoading(false);
      return;
    }

    console.log("[useProfessionalReviews] initial load", { professionalId, limit });
    setIsLoading(true);

    Promise.all([
      fetchProfessionalReviews(professionalId, { limit, offset: 0 }),
      fetchProfessionalReviewStats(professionalId),
    ])
      .then(([items, nextStats]) => {
        if (generationRef.current !== gen) return;
        setReviews(items);
        setStats(nextStats);
        setHasMore(items.length >= limit);
        offsetRef.current = items.length;
      })
      .catch((err) => {
        if (generationRef.current !== gen) return;
        console.log("[useProfessionalReviews] load error", err);
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (generationRef.current !== gen) return;
        setIsLoading(false);
      });
  }, [professionalId, limit, enabled, fetchKey]);

  // ── Siguiente página ───────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!enabled || !professionalId) return;
    if (!hasMore || loadingMoreRef.current || isLoading) return;

    const gen = generationRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    console.log("[useProfessionalReviews] load more", {
      professionalId,
      offset: offsetRef.current,
    });

    fetchProfessionalReviews(professionalId, {
      limit,
      offset: offsetRef.current,
    })
      .then((items) => {
        if (generationRef.current !== gen) return;
        setReviews((prev) => [...prev, ...items]);
        setHasMore(items.length >= limit);
        offsetRef.current += items.length;
      })
      .catch((err) => {
        if (generationRef.current !== gen) return;
        console.log("[useProfessionalReviews] load more error", err);
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (generationRef.current !== gen) return;
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
  }, [professionalId, limit, enabled, hasMore, isLoading]);

  // ── Refetch manual (post-submit, pull-to-refresh, retry) ───────────────
  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return {
    reviews,
    stats,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 👀 REVIEW NOTES
// ─────────────────────────────────────────────────────────────────────────────
// 1. Patrón de "generation counter" (generationRef) — copiado de
//    `usePaginatedProfessionals`. Si el hook se resetea (cambia professionalId,
//    limit, enabled, o refetch), el gen se incrementa. Las respuestas pendientes
//    de la versión anterior se descartan. Evita race conditions si el usuario
//    navega rápido entre perfiles.
//
// 2. `Promise.all([reviews, stats])` — se cargan en paralelo. Son 2 roundtrips
//    que ya no bloquean al otro. Si stats falla pero reviews OK, se marca el
//    error global y no se muestra ninguno (conservador). Si querés mostrar
//    reviews aunque stats falle, hay que separar los estados.
//
// 3. Paginación OFFSET-BASED (no keyset). Decisión: volúmenes esperados bajos
//    (< 100 reseñas por pro). Si crece, migrar a keyset con cursor
//    (created_at, id) como en el service de search.
//
// 4. `hasMore = items.length >= limit` — si la última página trae exactamente
//    `limit`, asumimos que HAY más. La siguiente página puede venir vacía,
//    ahí `hasMore = 0 >= limit = false`. Un roundtrip "vacío" extra, aceptable.
//
// 5. `refetch` incrementa `fetchKey` → dispara el useEffect → reset completo.
//    Se llama desde screen tras createReview/updateReview/deleteReview para
//    refrescar la lista y stats.
//
// 6. Si `enabled=false` o no hay `professionalId`, el hook NO fetchea pero
//    igual resetea el state. Útil para "pausar" cuando falta contexto.

