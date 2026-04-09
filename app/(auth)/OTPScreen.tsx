import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppHeader,
  IconButton,
  ScreenTitle,
  OTPInput,
  Badge,
  Button,
} from '@/shared/components';
import { colors, spacing, layout } from '@/shared/theme';
import { strings } from '@/shared/utils/strings';
import { useVerifyOtp } from '@/features/auth/hooks/useVerifyOtp';
import { useSendOtp } from '@/features/auth/hooks/useSendOtp';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString();

  const { verifyOtp, loading } = useVerifyOtp();
  const { sendOtp, loading: resending } = useSendOtp();

  const [code, setCode] = useState('');
  const isComplete = code.length === OTP_LENGTH;

  const handleVerify = async () => {
    try {
      await verifyOtp(email, code);
      // El guard de app/index.tsx decide a dónde mandar al user según el status.
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Código inválido', err?.message ?? 'Probá de nuevo.');
      setCode('');
    }
  };

  const handleResend = async () => {
    try {
      await sendOtp(email);
      setCode('');
      Alert.alert('Código reenviado', `Te mandamos un nuevo código a ${email}.`);
    } catch (err: any) {
      Alert.alert('No pudimos reenviar', err?.message ?? 'Probá de nuevo.');
    }
  };

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
              label={resending ? 'Enviando...' : strings.auth.otpResend}
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
