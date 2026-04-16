// Hook: useNearbyProfessionals
// Capa: hook (orquesta loading/error/data)
// Cliente: usuario final
//
// Trae los 5 profesionales más cercanos al usuario para la sección
// "Cerca tuyo" del HomeScreen. Limit fijo, sin paginación (no usa
// usePaginatedProfessionals porque no necesita loadMore/infinite scroll).
//
// Depende de useMyLocation() para obtener lat/lng del usuario.
// Llama a fetchNearbyProfessionals() del service (RPC nearby_professionals).

import { useState, useEffect } from "react";

import { useMyLocation } from "@/features/professionals/hooks/useMyLocation";
import { fetchNearbyProfessionals } from "@/shared/services/professionalSearchService";
import type { ProfessionalListItem } from "@/features/professionals/types";
import { strings } from "@/shared/utils/strings";

const HOME_NEARBY_LIMIT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface UseNearbyProfessionalsResult {
  professionals: ProfessionalListItem[];
  isLoading:     boolean;
  error:         string | null;
  refetch:       () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useNearbyProfessionals(): UseNearbyProfessionalsResult {
  const { location, isLoading: locationLoading } = useMyLocation();

  const [professionals, setProfessionals] = useState<ProfessionalListItem[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [fetchKey, setFetchKey]           = useState(0);

  useEffect(() => {
    // Sin ubicación todavía → mantener skeleton visible.
    if (locationLoading || !location) {
      setIsLoading(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchNearbyProfessionals({
      lat:   location.lat,
      lng:   location.lng,
      limit: HOME_NEARBY_LIMIT,
    })
      .then((data) => {
        if (cancelled) return;
        setProfessionals(data);
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
  }, [location?.lat, location?.lng, locationLoading, fetchKey]);

  return {
    professionals,
    isLoading: locationLoading || isLoading,
    error,
    refetch: () => setFetchKey((k) => k + 1),
  };
}
