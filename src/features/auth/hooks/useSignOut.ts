// useSignOut — cierra sesión y redirige al guard
// Capa: features/auth/hooks
// Service: authStore.signOut (que internamente llama a authService.signOut)
//
// El hook expone { signOut, loading } para que la screen pueda deshabilitar
// el botón mientras la operación está en vuelo y manejar errores con Alert.

import { useCallback, useState } from "react";
import { router } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";

export function useSignOut() {
  const storeSignOut = useAuthStore((s) => s.signOut);
  const [loading, setLoading] = useState(false);

  const signOut = useCallback(async (): Promise<void> => {
    console.log("[useSignOut] Iniciando cierre de sesión…");
    setLoading(true);
    try {
      await storeSignOut();
      console.log("[useSignOut] Sesión cerrada. Redirigiendo al guard…");
      // El store queda en unauthenticated → el guard manda a WelcomeScreen.
      router.replace("/");
    } catch (err) {
      console.error("[useSignOut] Error al cerrar sesión →", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [storeSignOut]);

  return { signOut, loading };
}
