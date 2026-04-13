import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppHeader,
  AppAlert,
  IconButton,
  ScreenTitle,
  OTPInput,
  Badge,
  Button,
} from '@/shared/components';
import { colors, spacing, layout } from '@/shared/theme';
import { strings, interpolate } from '@/shared/utils/strings';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { useSendOtp } from '@/features/auth/hooks/useSendOtp';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_S = 60;

// ─────────────────────────────────────────────────────────────────────────────
// ALERT STATE HELPER
// ─────────────────────────────────────────────────────────────────────────────

interface AlertState {
  visible: boolean;
  icon: "error" | "success" | "warning";
  title: string;
  message: string;
}

const ALERT_HIDDEN: AlertState = { visible: false, icon: "error", title: "", message: "" };

const ALERT_ICONS: Record<AlertState["icon"], React.ReactNode> = {
  error:   <Ionicons name="alert-circle-outline" size={28} color={colors.status.error} />,
  success: <Ionicons name="checkmark-circle-outline" size={28} color={colors.status.success} />,
  warning: <Ionicons name="time-outline" size={28} color={colors.status.warning} />,
};

export default function OTPScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString();

  const { verifyOtp, loading } = useVerifyOtp();
  const { sendOtp, loading: resending } = useSendOtp();

  const [code, setCode] = useState('');
  const isComplete = code.length === OTP_LENGTH;

  // ── COOLDOWN ────────────────────────────────────────────────────────────
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(RESEND_COOLDOWN_S);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Arranca el cooldown al montar (el OTP ya se envió en SignInScreen).
  useEffect(() => {
    startCooldown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startCooldown]);

  const canResend = cooldown === 0;

  // ── ALERT ───────────────────────────────────────────────────────────────
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  // ── HANDLERS ────────────────────────────────────────────────────────────

  const handleVerify = async () => {
    try {
      await verifyOtp(email, code);
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
      setAlert({ visible: true, icon: "error", title: strings.auth.alertVerifyErrorTitle, message: msg });
      setCode('');
    }
  };

  const handleResend = async () => {
    if (!canResend) {
      setAlert({
        visible: true,
        icon: "warning",
        title: strings.auth.alertResendCooldownTitle,
        message: interpolate(strings.auth.alertResendCooldownMsg, { seconds: cooldown }),
      });
      return;
    }

    try {
      await sendOtp(email);
      setCode('');
      startCooldown();
      setAlert({
        visible: true,
        icon: "success",
        title: strings.auth.alertResendSuccessTitle,
        message: interpolate(strings.auth.alertResendSuccessMsg, { email }),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
      setAlert({ visible: true, icon: "error", title: strings.auth.alertResendErrorTitle, message: msg });
    }
  };

  // ── RENDER ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>

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
          title={strings.auth.otpTitle}
          description={strings.auth.otpSubtitle}
        />

        {/* ── OTP ──────────────────────────────────────── */}
        <View style={styles.otpSection}>
          <OTPInput
            value={code}
            onChange={setCode}
          />
        </View>

        {/* ── REENVIAR ─────────────────────────────────── */}
        <View style={styles.resendSection}>
          <Pressable
            onPress={handleResend}
            disabled={resending}
            style={({ pressed }) => ({ opacity: pressed || resending ? 0.6 : 1 })}
          >
            <Badge
              variant="tag"
              label={
                resending
                  ? 'Enviando...'
                  : canResend
                    ? strings.auth.otpResend
                    : `${strings.auth.otpResend} (${cooldown}s)`
              }
              icon={
                <Ionicons
                  name="refresh"
                  size={12}
                  color={colors.text.secondary}
                />
              }
            />
          </Pressable>
        </View>

        <View style={styles.spacer} />

        <Button
          label={loading ? 'Verificando...' : strings.auth.otpCta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isComplete || loading}
          onPress={handleVerify}
        />

      </View>

      {/* ── ALERT ──────────────────────────────────────── */}
      <AppAlert
        visible={alert.visible}
        icon={ALERT_ICONS[alert.icon]}
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
  otpSection: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  resendSection: {
    marginTop: spacing[6],
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
});
