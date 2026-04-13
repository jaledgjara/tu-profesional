// useCreateProfile — crea/actualiza la fila profiles + refresca el store
// Capa: features/auth/hooks
// Service: profileService.createProfile + authStore.refresh
//
// Lo usa UserTypeScreen al elegir rol. profiles solo guarda id + role;
// datos personales (full_name, phone) viven en professionals.

import { useCallback, useState } from "react";

import { createProfile as createProfileService } from "@/shared/services/profileService";
import { useAuthStore } from "@/features/auth/store/authStore";
import type { UserType } from "@/features/auth/Type/UserType";

interface CreateProfileInput {
  role: UserType;
}

export function useCreateProfile() {
  const session = useAuthStore((s) => s.session);
  const refresh = useAuthStore((s) => s.refresh);
  const [loading, setLoading] = useState(false);

  const createProfile = useCallback(
    async (input: CreateProfileInput): Promise<void> => {
      if (!session) {
        console.error("[useCreateProfile] Sin sesión activa — no se puede crear el profile.");
        throw new Error("Tu sesión expiró. Iniciá sesión de nuevo.");
      }
      console.log("[useCreateProfile] Creando profile — userId:", session.user.id, "| rol elegido:", input.role);
      setLoading(true);
      try {
        await createProfileService({
          userId: session.user.id,
          role:   input.role,
          email:  session.user.email ?? "",
        });
        console.log("[useCreateProfile] Profile creado. Refrescando authStore…");
        await refresh();
        console.log("[useCreateProfile] authStore actualizado. El guard redirigirá al paso de ubicación.");
      } finally {
        setLoading(false);
      }
    },
    [session, refresh],
  );

  return { createProfile, loading };
}
