// Hook: useProfessionalProfile
// Capa: hook (features/professionals)
//
// Wrapper sobre `professionalProfileStore` (Zustand). Cada screen que lo usa
// se suscribe al MISMO state, así un upsert en edit-profile se ve reflejado
// instantáneamente en briefcase, home y profile sin pasar props ni eventos.
//
// La firma `{ professional, isLoading, error, refetch }` se mantiene igual
// para no romper a los consumidores existentes.

import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/authStore";
import { useProfessionalProfileStore } from "@/features/professionals/store/professionalProfileStore";
import type { Professional as ProfessionalRow } from "@/shared/services/profileService";

interface UseProfessionalProfileResult {
  professional: ProfessionalRow | null;
  isLoading:    boolean;
  error:        Error | null;
  refetch:      () => Promise<void>;
}

export function useProfessionalProfile(): UseProfessionalProfileResult {
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  // Selectores granulares — cada componente sólo se re-renderiza cuando
  // cambia el slice que realmente lee.
  const professional   = useProfessionalProfileStore((s) => s.professional);
  const isLoading      = useProfessionalProfileStore((s) => s.isLoading);
  const error          = useProfessionalProfileStore((s) => s.error);
  const currentUserId  = useProfessionalProfileStore((s) => s.currentUserId);
  const load           = useProfessionalProfileStore((s) => s.load);
  const refresh        = useProfessionalProfileStore((s) => s.refresh);

  // Carga inicial / cuando cambia el user (login/logout). El store deduplica
  // si ya hay data del mismo user, así no spammeamos la red.
  useEffect(() => {
    if (userId && userId !== currentUserId) {
      load(userId);
    }
  }, [userId, currentUserId, load]);

  return { professional, isLoading, error, refetch: refresh };
}
