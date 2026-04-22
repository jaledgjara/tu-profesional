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
      if (!email) {
        console.error("[useVerifyOtp] Email ausente — el usuario llegó a OTP sin completar el paso anterior.");
        throw new Error("Falta el email del paso anterior");
      }
      console.log("[useVerifyOtp] Verificando código OTP — email:", email, "| dígitos ingresados:", code.length);
      setLoading(true);
      try {
        await verifyOtpService(email, code);
        console.log("[useVerifyOtp] Código correcto. Refrescando authStore…");
        await refresh();
        console.log("[useVerifyOtp] authStore actualizado. El guard redirigirá según el status.");
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  return { verifyOtp, loading };
}
