import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  DMSans_400Regular,
  DMSans_400Regular_Italic,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { onAuthStateChange } from '@/shared/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);

  // Se suscribe a cambios de auth (login/logout/token refresh).
  // Supabase emite INITIAL_SESSION al subscribirse, así que no hace falta
  // llamar a refresh() aparte — eso causaba doble llamada en el arranque.
  //
  // Filtrado:
  //   - TOKEN_REFRESHED: Supabase rota el JWT cada hora. El user es el mismo,
  //     el profile es el mismo y la ubicación es la misma. Hacer un refresh()
  //     completo (3 queries) es puro overhead y abre una ventana de race que
  //     puede tirar el status transitoriamente.
  //   - USER_UPDATED: cambios de metadata internos de auth (ej. password) que
  //     no afectan al guard.
  useEffect(() => {
    const sub = onAuthStateChange((event, _session) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        return;
      }
      refresh();
    });
    return () => sub.unsubscribe();
  }, [refresh]);

  // AppState listener: cuando la app vuelve a foreground, rehacemos refresh()
  // para detectar cambios que ocurrieron por fuera (ej: un admin la suspendió
  // mientras la app estaba en background). La RLS ya bloquea acciones
  // sensibles de un suspendido; este refresh cierra la ventana visual.
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      // background/inactive → active: el user volvió a abrir la app.
      if ((prev === "background" || prev === "inactive") && next === "active") {
        console.log("[_layout] app volvió a foreground → refresh()");
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    DMSans_400Regular,
    DMSans_400Italic: DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(blocked)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(professional)" />
      </Stack>
    </>
  );
}
