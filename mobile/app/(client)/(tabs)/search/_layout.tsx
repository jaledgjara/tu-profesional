import { Stack } from "expo-router";

// Stack anidado dentro del tab "Buscar".
// - index                       → SearchScreen (raíz del tab, sin header)
// - CategoryProfesionalScreen   → pantalla pushed, sin tab bar

export default function SearchLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
