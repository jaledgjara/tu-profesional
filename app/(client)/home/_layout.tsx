import { Stack } from 'expo-router';

// Stack anidado dentro del tab "Inicio".
// - index    → HomeScreen (raíz del tab, sin header)
// - [id]     → ClientProfessionalProfile (pantalla pushed, sin tab bar)

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
