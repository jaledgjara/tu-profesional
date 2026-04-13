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
import { useEffect } from 'react';

import { onAuthStateChange } from '@/shared/services/authService';
import { useAuthStore } from '@/features/auth/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const refresh = useAuthStore((s) => s.refresh);

  // Se suscribe a cambios de auth (login/logout/token refresh).
  // Supabase emite INITIAL_SESSION al subscribirse, así que no hace falta
  // llamar a refresh() aparte — eso causaba doble llamada en el arranque.
  useEffect(() => {
    const sub = onAuthStateChange((_event, _session) => {
      refresh();
    });
    return () => sub.unsubscribe();
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
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(professional)" />
      </Stack>
    </>
  );
}
