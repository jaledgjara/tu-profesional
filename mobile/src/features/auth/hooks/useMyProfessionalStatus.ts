// useMyProfessionalStatus — orquesta la lectura del status del profesional.
//
// Comportamiento:
//   - status arranca en null: la screen muestra un loader hasta que el primer
//     fetch resuelva. Nunca pintamos un estado "pending" optimista que podría
//     ser mentiroso (el admin pudo haber aprobado o rechazado entre sesiones).
//   - En mount y cuando la app vuelve al foreground, refetch: si el admin ya
//     revisó, el estado se actualiza a approved / rejected.
//
// Capa: hook. Consume el service y expone { status, rejectionReason, isLoading,
// refresh }. Usa el userId del authStore.

import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/auth/store/authStore";
import {
  getMyProfessionalStatus,
  type ProfessionalStatus,
} from "@/features/auth/services/professionalStatusService";

interface Result {
  status:          ProfessionalStatus | null;
  rejectionReason: string | null;
  isLoading:       boolean;
  error:           string | null;
  refresh:         () => Promise<void>;
}

export function useMyProfessionalStatus(): Result {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  const [status,          setStatus]          = useState<ProfessionalStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLoading,       setIsLoading]       = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const result = await getMyProfessionalStatus(userId);
      if (result) {
        setStatus(result.status);
        setRejectionReason(result.rejectionReason);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Mount: fetch inicial
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Foreground: el pro vuelve a la app → re-chequea si el admin ya revisó
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { status, rejectionReason, isLoading, error, refresh };
}
