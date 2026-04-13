import { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  AppAlert,
  IconButton,
  ScreenTitle,
  TextInput,
  Button,
} from "@/shared/components";
import { colors, spacing, layout } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useSendOtp } from "@/features/auth/hooks/useSendOtp";

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const { sendOtp, loading } = useSendOtp();
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  const handleSendOtp = async () => {
    try {
      const normalized = await sendOtp(email);
      router.push({
        pathname: "/(auth)/OTPScreen",
        params: { email: normalized },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
      setAlert({ visible: true, title: strings.auth.alertSendErrorTitle, message: msg });
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

      {/* ── ALERT ──────────────────────────────────────── */}
      <AppAlert
        visible={alert.visible}
        icon={<Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />}
        title={alert.title}
        message={alert.message}
        dismissLabel={strings.auth.alertClose}
        onDismiss={dismissAlert}
      />
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
    paddingBottom: spacing[10],
  },
  spacer: {
    flex: 1,
  },
});
