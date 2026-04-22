// Hook: useSearchProfessionals
// Capa: hook (orquesta debounce + paginación)
// Cliente: usuario final
//
// Conecta el TextInput de búsqueda con el RPC search_professionals.
// Debounce de 300ms para no disparar un RPC por cada keystroke.
// Usa usePaginatedProfessionals para infinite scroll con cursor keyset.
//
// Uso en SearchScreen:
//   const { professionals, isLoading, isSearchActive, loadMore } =
//     useSearchProfessionals(query);
//
//   isSearchActive === false → mostrar grid de áreas (comportamiento actual)
//   isSearchActive === true  → mostrar FlatList con resultados paginados

import { useState, useCallback, useEffect } from "react";

import { useMyLocation } from "@/features/professionals/hooks/useMyLocation";
import { usePaginatedProfessionals } from "@/features/professionals/hooks/usePaginatedProfessionals";
import { searchProfessionals } from "@/shared/services/professionalSearchService";
import type { ProfessionalCursor } from "@/features/professionals/types";

const SEARCH_PAGE_SIZE = 20;
const DEBOUNCE_MS      = 300;

export function useSearchProfessionals(
  query: string,
  areaFilter?: string[] | null,
) {
  const { location } = useMyLocation();

  // ── Debounce ────────────────────────────────────────────────────────────
  // Solo actualiza debouncedQuery 300ms después del último cambio de query.
  // Esto evita disparar un RPC por cada letra que tipea el usuario.
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      // Sin debounce para limpiar — la UI debe volver al grid de áreas instantáneamente.
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // ── fetchPage estable ───────────────────────────────────────────────────
  // Cambia cuando cambian debouncedQuery, location, o areaFilter.
  // Cuando cambia, usePaginatedProfessionals resetea y carga página 1.
  const fetchPage = useCallback(
    async (cursor: ProfessionalCursor | null) => {
      if (!location || !debouncedQuery) return [];
      return searchProfessionals({
        query:           debouncedQuery,
        lat:             location.lat,
        lng:             location.lng,
        limit:           SEARCH_PAGE_SIZE,
        cursorDistanceM: cursor?.distanceM ?? null,
        cursorId:        cursor?.id ?? null,
        areaFilter:      areaFilter ?? null,
      });
    },
    [debouncedQuery, location?.lat, location?.lng, areaFilter],
  );

  const paginated = usePaginatedProfessionals({
    fetchPage,
    pageSize: SEARCH_PAGE_SIZE,
    enabled:  debouncedQuery.length > 0 && !!location,
  });

  return {
    ...paginated,
    /** true cuando hay texto en el search bar (después del debounce). */
    isSearchActive: debouncedQuery.length > 0,
  };
}
