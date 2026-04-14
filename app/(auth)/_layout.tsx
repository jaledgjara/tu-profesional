// Layout del grupo de auth con REVERSE GUARD.
//
// Defiende contra navegaciones espurias a Welcome/OTP/etc. cuando el usuario
// ya está autenticado (típicamente pasa tras Fast Refresh o errores transitorios
// de red que disparaban un "unauthenticated" temporal).
//
// Excepción: si el status es `needs-role` o `needs-location`, las screens de
// este grupo siguen siendo el destino correcto (UserTypeScreen / ClientLocationFormScreen
// / ProfessionalFormScreen), así que no redirigimos en esos casos.

import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/features/auth/store/authStore";

export default function AuthLayout() {
  const status  = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  if (status === "authenticated") {
    const href =
      profile?.role === "professional"
        ? "/(professional)/home"
        : "/(client)/home";
    console.log("[authLayout] reverse guard — user autenticado, redirigiendo a", href);
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
