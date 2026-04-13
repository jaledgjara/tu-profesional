// Auth guard del root. Decide a dónde mandar al user en función del status
// del authStore. El status se calcula en authStore.refresh() llamando a
// getSession + getProfile + hasUserLocation.
//
// Patrón de navegación: las screens de auth hacen `router.replace('/')` al
// terminar su paso — este guard recalcula el destino en función del nuevo
// status. Esto centraliza TODA la lógica de routing en un solo lugar.
// Excepción: ProfessionalFormScreen → ProfessionalLocationFormScreen
// (ver comentario inline).

import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { MiniLoader } from "@/shared/components";

export default function Index() {
  const status  = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  console.log("[guard] Evaluando redirect — status:", status, "| rol:", profile?.role ?? "—");

  if (status === "loading") {
    return <MiniLoader />;
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/WelcomeScreen" />;
  }

  if (status === "needs-role") {
    return <Redirect href="/(auth)/UserTypeScreen" />;
  }

  if (status === "needs-location") {
    if (profile?.role === "professional") {
      return <Redirect href="/(auth)/ProfessionalFormScreen" />;
    }
    return <Redirect href="/(auth)/ClientLocationFormScreen" />;
  }

  // authenticated
  return (
    <Redirect
      href={
        profile?.role === "professional"
          ? "/(professional)/home"
          : "/(client)/home"
      }
    />
  );
}
