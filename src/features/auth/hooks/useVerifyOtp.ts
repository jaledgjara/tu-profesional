// useVerifyOtp — verifica el código OTP y refresca el authStore
// Capa: features/auth/hooks
// Service: authService.verifyOtp + authStore.refresh
//
// Después de verificar, llama a refresh() del store para que el guard del
// root recalcule el status (needs-role / needs-location / authenticated)
// y la screen pueda hacer router.replace('/') con confianza.

import { useCallback, useState } from "react";

import { verifyOtp as verifyOtpService } from "@/shared/services/authService";
import { useAuthStore } from "@/features/auth/store/authStore";

export function useVerifyOtp() {
  const refresh = useAuthStore((s) => s.refresh);
  const [loading, setLoading] = useState(false);

  const verifyOtp = useCallback(
    async (email: string, code: string): Promise<void> => {
      if (!email) throw new Error("Falta el email del paso anterior");
      setLoading(true);
      try {
        await verifyOtpService(email, code);
        await refresh();
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  return { verifyOtp, loading };
}
