// Layout del grupo de auth con REVERSE GUARD.
//
// Si el usuario ya está autenticado, lo redirige a su home (via getHomeRoute).
// Si está en needs-role/needs-location, las screens de este grupo son el
// destino correcto — no redirigimos.
//
// Excepción: ProfessionalStatusScreen. Cuando el pro recién completa la
// ubicación, authStore pasa a 'authenticated' (ya tiene profile + location).
// Sin esta excepción, el guard lo mandaría al dashboard y nunca vería
// pending/approved/rejected. Dejamos que la screen de status decida qué hacer.

import { Redirect, Stack, useSegments } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";
import { getHomeRoute } from "@/shared/utils/routeResolver";

const STATUS_SCREEN_NAME = "ProfessionalStatusScreen";

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);
  const role   = useAuthStore((s) => s.profile?.role ?? null);
  const segments = useSegments();

  // Último segmento = nombre del screen actualmente activo dentro del grupo.
  const currentScreen = segments[segments.length - 1];
  const onStatusScreen = currentScreen === STATUS_SCREEN_NAME;

  if (status === "authenticated" && !onStatusScreen) {
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
      <Stack.Screen name="ProfessionalStatusScreen" />
    </Stack>
  );
}
