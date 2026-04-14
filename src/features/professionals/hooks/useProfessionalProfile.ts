// Hook: useProfessionalProfile
// Capa: hook (features/professionals)
// Carga la fila de `professionals` del usuario logueado desde Supabase.
// Lo consumen las pantallas del cliente profesional (home, briefcase, profile).
//
// No confundir con `useProfessionalDetail(id)`, que trae un profesional arbitrario
// (el que un cliente final está viendo) por id.

import { useCallback, useEffect, useState } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getProfessional,
  type Professional as ProfessionalRow,
} from "@/shared/services/profileService";

interface UseProfessionalProfileResult {
  professional: ProfessionalRow | null;
  isLoading:    boolean;
  error:        Error | null;
  refetch:      () => Promise<void>;
}

export function useProfessionalProfile(): UseProfessionalProfileResult {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  const [professional, setProfessional] = useState<ProfessionalRow | null>(null);
  const [isLoading,    setIsLoading]    = useState<boolean>(false);
  const [error,        setError]        = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setProfessional(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const row = await getProfessional(userId);
      setProfessional(row);
    } catch (err) {
      console.error("[useProfessionalProfile] Error al cargar fila de professionals:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("No pudimos cargar tu perfil profesional. Intentá de nuevo."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { professional, isLoading, error, refetch: load };
}
