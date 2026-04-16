// Hook: useProfessionalsByArea
// Capa: hook (orquesta paginación por área)
// Cliente: usuario final
//
// Trae profesionales filtrados por un área específica (ej: "tcc",
// "psicologia_infantil") con infinite scroll via cursor keyset.
// Usado en CategoryProfesionalScreen.
//
// Uso:
//   const { professionals, isLoading, isLoadingMore, hasMore, loadMore, refetch } =
//     useProfessionalsByArea("tcc");

import { useCallback } from "react";

import { useMyLocation } from "@/features/professionals/hooks/useMyLocation";
import { usePaginatedProfessionals } from "@/features/professionals/hooks/usePaginatedProfessionals";
import { fetchProfessionalsByArea } from "@/shared/services/professionalSearchService";
import type { ProfessionalCursor } from "@/features/professionals/types";

const AREA_PAGE_SIZE = 20;

export function useProfessionalsByArea(areaSlug: string) {
  const { location, isLoading: locationLoading } = useMyLocation();

  const fetchPage = useCallback(
    async (cursor: ProfessionalCursor | null) => {
      if (!location) return [];
      return fetchProfessionalsByArea({
        areaSlug,
        lat:             location.lat,
        lng:             location.lng,
        limit:           AREA_PAGE_SIZE,
        cursorDistanceM: cursor?.distanceM ?? null,
        cursorId:        cursor?.id ?? null,
      });
    },
    [areaSlug, location?.lat, location?.lng],
  );

  return usePaginatedProfessionals({
    fetchPage,
    pageSize: AREA_PAGE_SIZE,
    enabled:  !!location && !locationLoading,
  });
}
