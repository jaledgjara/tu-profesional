// Hook: useProfessionalDetail
// Capa: hook (orquesta loading/error/data)
// Cliente: usuario final
//
// Carga el perfil completo de un profesional por su ID.
// Combina query a tabla `professionals` + RPC `get_professional_location`.
// La distancia (distanceM) se pasa desde la lista como route param.

import { useState, useEffect } from "react";

import { fetchProfessionalDetail } from "@/shared/services/professionalSearchService";
import type { ProfessionalDetail } from "@/features/professionals/types";
import { strings } from "@/shared/utils/strings";

export interface UseProfessionalDetailResult {
  detail:    ProfessionalDetail | null;
  isLoading: boolean;
  error:     string | null;
}

export function useProfessionalDetail(
  id: string | undefined,
  distanceM?: number,
): UseProfessionalDetailResult {
  const [detail, setDetail]       = useState<ProfessionalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDetail(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchProfessionalDetail(id, distanceM)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
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
  }, [id, distanceM]);

  return { detail, isLoading, error };
}
