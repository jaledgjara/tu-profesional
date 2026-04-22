// Hook: useMyLocation
// Capa: hook (features/professionals)
//
// Wrapper sobre `myLocationStore` (Zustand). Estado compartido entre todas las
// pantallas que muestran la ubicación del user logueado, así un upsert se
// refleja instantáneamente en cualquier vista que la consuma.

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useMyLocationStore } from "@/features/professionals/store/myLocationStore";
import type { UserLocationAddress } from "@/shared/services/locationService";

interface UseMyLocationResult {
  location:  UserLocationAddress | null;
  isLoading: boolean;
  error:     Error | null;
  refetch:   () => Promise<void>;
}

export function useMyLocation(): UseMyLocationResult {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  const location      = useMyLocationStore((s) => s.location);
  const isLoading     = useMyLocationStore((s) => s.isLoading);
  const error         = useMyLocationStore((s) => s.error);
  const currentUserId = useMyLocationStore((s) => s.currentUserId);
  const load          = useMyLocationStore((s) => s.load);
  const refresh       = useMyLocationStore((s) => s.refresh);

  useEffect(() => {
    if (userId && userId !== currentUserId) {
      load(userId);
    }
  }, [userId, currentUserId, load]);

  return { location, isLoading, error, refetch: refresh };
}
