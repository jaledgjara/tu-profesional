// Layout raíz del área cliente.
// Es un Stack que contiene dos "ramas":
//   · (tabs)                  → navegación por tabs (home, search, profile)
//   · profile/settings/*      → pantallas full-screen sin tab bar
//
// Mismo patrón que el área profesional: la (tabs) es un route group que no
// afecta la URL. Las settings se abren como screens del Stack, ocultando
// el tab bar automáticamente.

import { Stack } from "expo-router";

export default function ClientLayout() {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      {/* Grupo de tabs — home, search, profile/index */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Settings — privacidad/legales */}
      <Stack.Screen
        name="profile/settings/privacy/index"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/privacy/terms"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/privacy/privacy"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/privacy/legal"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />

      {/* Settings — opciones de cuenta */}
      <Stack.Screen
        name="profile/settings/account/index"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/account/faq"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/account/notifications"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/account/contact"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
      <Stack.Screen
        name="profile/settings/account/delete-account"
        options={{ animation: "slide_from_right", gestureEnabled: true }}
      />
    </Stack>
  );
}
