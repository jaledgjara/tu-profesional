// Hook: usePaginatedProfessionals
// Capa: hook (genérico reutilizable)
//
// Implementa cursor-based (keyset) pagination para FlatList.
// Los 3 RPCs de listado (nearby, search, by-area) comparten el mismo patrón
// de cursor: (distance_m, id). Este hook abstrae ese ciclo de vida:
//
//   1. Fetch página 1 con cursor = null
//   2. Extraer cursor del último item: { distanceM, id }
//   3. onEndReached → fetch siguiente página con ese cursor
//   4. Append resultados. Si devuelve < pageSize → hasMore = false
//   5. Si cambian los params (nueva query, nuevo area) → reset + página 1
//
// El caller debe estabilizar `fetchPage` con useCallback para que el
// useEffect no se dispare en cada render.

import { useState, useEffect, useCallback, useRef } from "react";

import type {
  ProfessionalListItem,
  ProfessionalCursor,
} from "@/features/professionals/types";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS PÚBLICOS
// ─────────────────────────────────────────────────────────────────────────────

export interface UsePaginatedProfessionalsOptions {
  /**
   * Función que trae UNA página. Recibe el cursor del último item
   * (null para la primera página) y retorna el array de resultados.
   * IMPORTANTE: estabilizar con useCallback — si la referencia cambia,
   * el hook resetea y refetchea desde página 1.
   */
  fetchPage: (cursor: ProfessionalCursor | null) => Promise<ProfessionalListItem[]>;
  /** Cantidad de items por página (debe coincidir con el p_limit del RPC). */
  pageSize: number;
  /** Cuando false, el hook no fetchea (ej: esperando ubicación). Default true. */
  enabled?: boolean;
}

export interface UsePaginatedProfessionalsResult {
  professionals: ProfessionalListItem[];
  /** true durante el fetch de la primera página. */
  isLoading:     boolean;
  /** true durante el fetch de páginas siguientes (append). */
  isLoadingMore: boolean;
  error:         string | null;
  /** false cuando la última página trajo menos items que pageSize. */
  hasMore:       boolean;
  /** Llamar desde FlatList.onEndReached para cargar la siguiente página. */
  loadMore:      () => void;
  /** Reset completo + re-fetch desde página 1. */
  refetch:       () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function usePaginatedProfessionals(
  options: UsePaginatedProfessionalsOptions,
): UsePaginatedProfessionalsResult {
  const { fetchPage, pageSize, enabled = true } = options;

  const [professionals, setProfessionals] = useState<ProfessionalListItem[]>([]);
  const [isLoading, setIsLoading]         = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [hasMore, setHasMore]             = useState(true);
  const [fetchKey, setFetchKey]           = useState(0);

  // Cursor del último item para la siguiente página.
  const cursorRef = useRef<ProfessionalCursor | null>(null);

  // Generation counter: se incrementa en cada reset. Si una respuesta
  // llega con un generation anterior al actual, se descarta (stale).
  const generationRef = useRef(0);

  // Flag para evitar llamadas concurrentes a loadMore.
  const loadingMoreRef = useRef(false);

  // ── Fetch página 1 (reset) ────────────────────────────────────────────
  // Se dispara cuando cambia fetchPage (nuevos params), enabled, o fetchKey (refetch manual).
  useEffect(() => {
    // Reset state
    const gen = ++generationRef.current;
    cursorRef.current      = null;
    loadingMoreRef.current = false;
    setProfessionals([]);
    setIsLoadingMore(false);
    setError(null);
    setHasMore(true);

    if (!enabled) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);

    fetchPage(null)
      .then((items) => {
        if (generationRef.current !== gen) return; // stale
        setProfessionals(items);
        setHasMore(items.length >= pageSize);
        if (items.length > 0) {
          const last = items[items.length - 1];
          cursorRef.current = { distanceM: last.distanceM, id: last.id };
        }
      })
      .catch((err) => {
        if (generationRef.current !== gen) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (generationRef.current !== gen) return;
        setIsLoading(false);
      });
  }, [fetchPage, pageSize, enabled, fetchKey]);

  // ── Cargar siguiente página ───────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (!hasMore || loadingMoreRef.current || isLoading || !enabled) return;

    const gen = generationRef.current;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    fetchPage(cursorRef.current)
      .then((items) => {
        if (generationRef.current !== gen) return;
        setProfessionals((prev) => [...prev, ...items]);
        setHasMore(items.length >= pageSize);
        if (items.length > 0) {
          const last = items[items.length - 1];
          cursorRef.current = { distanceM: last.distanceM, id: last.id };
        }
      })
      .catch((err) => {
        if (generationRef.current !== gen) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (generationRef.current !== gen) return;
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
  }, [fetchPage, hasMore, isLoading, enabled, pageSize]);

  // ── Refetch manual (pull-to-refresh, retry) ───────────────────────────
  // Incrementa fetchKey → el useEffect principal se re-ejecuta → página 1.
  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  return {
    professionals,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  };
}
