// useCreateProfile — crea/actualiza la fila profiles + refresca el store
// Capa: features/auth/hooks
// Service: profileService.createProfile + authStore.refresh
//
// Lo usa UserTypeScreen al elegir rol. También lo puede reusar el flujo
// del profesional para actualizar full_name/phone (createProfile es upsert).

import { useCallback, useState } from "react";

import { createProfile as createProfileService } from "@/shared/services/profileService";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { UserType } from "@/features/auth/Type/UserType";

interface CreateProfileInput {
  role:      UserType;
  fullName?: string | null;
  phone?:    string | null;
}

export function useCreateProfile() {
  const session = useAuthStore((s) => s.session);
  const refresh = useAuthStore((s) => s.refresh);
  const [loading, setLoading] = useState(false);

  const createProfile = useCallback(
    async (input: CreateProfileInput): Promise<void> => {
      if (!session) throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");
      setLoading(true);
      try {
        await createProfileService({
          userId:   session.user.id,
          role:     input.role,
          fullName: input.fullName ?? null,
          phone:    input.phone ?? null,
        });
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [session, refresh],
  );

  return { createProfile, loading };
}
