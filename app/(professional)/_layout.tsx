// Layout raíz del área profesional.
// Es un Stack que contiene dos "ramas":
//   · (tabs)              → navegación por tabs (home, briefcase, profile)
//   · profile/edit-profile → pantalla full-screen sin tab bar (al estilo IG
//                             cuando abrís un chat: el tab bar desaparece).
//
// La (tabs) es un route group — no afecta la URL. La ruta del perfil público
// sigue siendo `/(professional)/profile`, y la de edición es
// `/(professional)/profile/edit-profile`.

import { Stack } from "expo-router";

export default function ProfessionalLayout() {
  return (
    <Stack
      // Al montar el área profesional, entramos por el grupo de tabs.
      // Cualquier URL tipo `/(professional)/home` resuelve dentro de (tabs).
      initialRouteName="(tabs)"
      screenOptions={{ headerShown: false }}
    >
      {/* Grupo de tabs — home, briefcase, profile/index. Tiene su propio _layout. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Editar perfil — hermano del grupo de tabs, no heredero del tab bar. */}
      <Stack.Screen
        name="profile/edit-profile"
        options={{
          animation:      "slide_from_right",
          gestureEnabled: true,
          headerShown:    false,
        }}
      />
    </Stack>
  );
}
