import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const [code, setCode] = useState('');

  const isComplete = code.length === OTP_LENGTH;

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
            onPress={() => setCode('')}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Badge
              variant="tag"
              label={strings.auth.otpResend}
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
          label={strings.auth.otpCta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isComplete}
          onPress={() => router.push('/(auth)/UserTypeScreen')}
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
