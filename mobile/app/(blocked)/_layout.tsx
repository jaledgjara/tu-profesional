// Layout del grupo (blocked): el user está logueado pero con un estado de
// cuenta que lo bloquea (suspended, eliminado, suscripción vencida, etc).
//
// Por qué un grupo aparte (no (auth)): conceptualmente el user YA pasó por
// auth — tiene session y profile. (auth) es para el flujo previo al login
// (Welcome, SignIn, OTP). Mezclarlos confunde el modelo mental y además
// hacía que el reverse guard de (auth)/_layout.tsx pudiera redirigir mal
// si el status cambiaba a 'authenticated' por un instante.
//
// Reverse guard acá NO hace falta: el root guard (app/index.tsx) decide
// según authStatus. Si el admin lo reactiva, status pasa a 'authenticated'
// → el root guard lo redirige al home de su rol, y este layout se
// desmonta solo.

import { Stack } from "expo-router";

export default function BlockedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuspendedScreen" />
    </Stack>
  );
}
