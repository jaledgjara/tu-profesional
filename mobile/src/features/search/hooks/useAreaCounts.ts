// Hook: useAreaCounts
// Capa: hook (one-shot fetch, sin paginación)
// Cliente: usuario final
//
// Trae el conteo de profesionales activos por área para mostrar en las
// SpecialtyCard del SearchScreen: "TCC (12)", "Psicoanálisis (5)", etc.
//
// Llama a count_professionals_by_area() una sola vez al montar.
// Retorna un mapa { slug → count } para lookup O(1).

import { useState, useEffect } from "react";

import { fetchAreaCounts } from "@/shared/services/professionalSearchService";
import { strings } from "@/shared/utils/strings";

export interface UseAreaCountsResult {
  /** Mapa area_slug → cantidad de profesionales activos. */
  counts:    Record<string, number>;
  isLoading: boolean;
  error:     string | null;
}

export function useAreaCounts(): UseAreaCountsResult {
  const [counts, setCounts]       = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    fetchAreaCounts()
      .then((data) => {
        if (cancelled) return;
        setCounts(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : strings.common.error);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { counts, isLoading, error };
}
