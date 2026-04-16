// Layout del grupo de auth con REVERSE GUARD.
//
// Si el usuario ya está autenticado, lo redirige a su home (via getHomeRoute).
// Si está en needs-role/needs-location, las screens de este grupo son el
// destino correcto — no redirigimos.

import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getHomeRoute } from "@/shared/utils/routeResolver";

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.profile?.role ?? null);

  if (status === "authenticated") {
    const href = getHomeRoute(role);
    console.log("[authLayout] reverse guard → redirigiendo a", href);
    return <Redirect href={href} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WelcomeScreen" />
      <Stack.Screen name="SignInScreen" />
      <Stack.Screen name="OTPScreen" />
      <Stack.Screen name="UserTypeScreen" />
      <Stack.Screen name="ClientLocationFormScreen" />
      <Stack.Screen name="ProfessionalFormScreen" />
      <Stack.Screen name="ProfessionalLocationFormScreen" />
    </Stack>
  );
}
