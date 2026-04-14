// Hook: useMyLocation
// Capa: hook (features/professionals)
// Carga la fila de `user_locations` del usuario logueado.
// Aplica a cualquier rol (cliente o profesional), pero hoy lo consume la vista
// "Mi portafolio" para mostrar la dirección que el profesional cargó en el
// registro. Si el cliente lo termina necesitando, se puede mover a un lugar
// más compartido — por ahora vive junto a `useProfessionalProfile`.

import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getMyUserLocation,
  type UserLocationAddress,
} from "@/shared/services/locationService";

interface UseMyLocationResult {
  location:  UserLocationAddress | null;
  isLoading: boolean;
  error:     Error | null;
  refetch:   () => Promise<void>;
}

export function useMyLocation(): UseMyLocationResult {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  const [location,  setLocation]  = useState<UserLocationAddress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error,     setError]     = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLocation(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const row = await getMyUserLocation(userId);
      setLocation(row);
    } catch (err) {
      console.error("[useMyLocation] Error al cargar user_locations:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("No pudimos cargar tu ubicación. Intentá de nuevo."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { location, isLoading, error, refetch: load };
}
