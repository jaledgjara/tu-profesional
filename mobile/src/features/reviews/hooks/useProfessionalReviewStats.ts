// Hook: useProfessionalReviewStats
// Capa: hook (orquesta loading/error/data)
// Cliente: usuario final — pantalla de perfil
//
// Lee SOLO los stats agregados (avg + count) de un profesional. Separado de
// useProfessionalReviews porque el perfil ya no necesita la lista de reseñas
// (eso vive en AllReviewsScreen). Evita el roundtrip extra al array.

import { useState, useEffect, useCallback } from "react";

import { fetchProfessionalReviewStats } from "@/shared/services/reviewsService";
import type { ReviewStats } from "@/features/reviews/types";
import { strings } from "@/shared/utils/strings";

export interface UseProfessionalReviewStatsResult {
  stats:     ReviewStats | null;
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useProfessionalReviewStats(
  professionalId: string | undefined,
  enabled: boolean = true,
): UseProfessionalReviewStatsResult {
  const [stats, setStats]         = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [fetchKey, setFetchKey]   = useState(0);

  useEffect(() => {
    if (!enabled || !professionalId) {
      setStats(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    console.log("[useProfessionalReviewStats] load", { professionalId });
    setIsLoading(true);
    setError(null);

    fetchProfessionalReviewStats(professionalId)
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.log("[useProfessionalReviewStats] error", err);
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [professionalId, enabled, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return { stats, isLoading, error, refetch };
}
