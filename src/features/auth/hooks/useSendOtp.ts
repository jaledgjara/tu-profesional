// useSendOtp — orquesta el envío del código OTP por email
// Capa: features/auth/hooks
// Service: authService.sendOtp
//
// Patrón: el hook expone { sendOtp, loading } y captura todos los errores
// como throw → la screen se encarga del Alert. Mantenemos la screen "silly"
// porque solo decide UX (cómo mostrar el error), no lógica de negocio.

import { useCallback, useState } from "react";

import { sendOtp as sendOtpService } from "@/shared/services/authService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useSendOtp() {
  const [loading, setLoading] = useState(false);

  const sendOtp = useCallback(async (rawEmail: string): Promise<string> => {
    const email = rawEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Email inválido");
    }
    setLoading(true);
    try {
      await sendOtpService(email);
      return email;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendOtp, loading };
}
