import { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  IconButton,
  ScreenTitle,
  TextInput,
  Button,
} from "@/shared/components";
import { colors, spacing, layout } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useSendOtp } from "@/features/auth/hooks/useSendOtp";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const { sendOtp, loading } = useSendOtp();

  const handleSendOtp = async () => {
    try {
      const normalized = await sendOtp(email);
      router.push({ pathname: "/(auth)/OTPScreen", params: { email: normalized } });
    } catch (err: any) {
      Alert.alert("No pudimos enviar el código", err?.message ?? "Probá de nuevo.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      {/* ── HEADER ───────────────────────────────────────── */}
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          <IconButton
            icon={
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.icon.inverse}
              />
            }
            onPress={() => router.back()}
          />
        }
      />

      {/* ── CONTENT ──────────────────────────────────────── */}
      <View style={styles.content}>
        <ScreenTitle
          title={strings.auth.emailLabel}
          description={strings.auth.emailDesc}
        />

        <TextInput
          label={strings.auth.emailLabel}
          placeholder={strings.auth.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
        />

        <View style={styles.spacer} />

        <Button
          label={loading ? "Enviando..." : strings.auth.emailCta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!email.trim() || loading}
          onPress={handleSendOtp}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing[6],
  },
  spacer: {
    flex: 1,
  },
});
