// Auth guard del root. Decide a dónde mandar al user en función del status
// del authStore. El status se calcula en authStore.refresh() llamando a
// getSession + getProfile + hasUserLocation.

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuthStore } from "@/features/auth/store/authStore";
import { colors } from "@/shared/theme";

export default function Index() {
  const status  = useAuthStore((s) => s.status);
  const profile = useAuthStore((s) => s.profile);

  if (status === "loading") {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background.screen,
        }}>
        <ActivityIndicator color={colors.brand.primary} />
      </View>
    );
  }

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/WelcomeScreen" />;
  }

  if (status === "needs-role") {
    return <Redirect href="/(auth)/UserTypeScreen" />;
  }

  if (status === "needs-location") {
    if (profile?.role === "professional") {
      return <Redirect href="/(auth)/ProfessionalFormScreen" />;
    }
    return <Redirect href="/(auth)/ClientLocationFormScreen" />;
  }

  // authenticated
  return (
    <Redirect
      href={
        profile?.role === "professional"
          ? "/(professional)/home"
          : "/(client)/home"
      }
    />
  );
}
