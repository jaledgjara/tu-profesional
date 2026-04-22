import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppHeader,
  AppAlert,
  IconButton,
  ScreenTitle,
  SelectableCard,
  Button,
} from '@/shared/components';
import { colors, spacing, layout } from '@/shared/theme';
import { strings } from '@/shared/utils/strings';
import { useCreateProfile } from '@/features/auth/hooks/useCreateProfile';
import type { UserType } from '@/features/auth/Type/UserType';

type RoleSelection = UserType | null;

interface AlertState { visible: boolean; title: string; message: string; }
const ALERT_HIDDEN: AlertState = { visible: false, title: "", message: "" };

export default function UserTypeScreen() {
  const [role, setRole] = useState<RoleSelection>(null);
  const { createProfile, loading } = useCreateProfile();
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);
  const dismissAlert = useCallback(() => setAlert(ALERT_HIDDEN), []);

  const handleContinue = async () => {
    if (!role) return;
    try {
      await createProfile({ role });
      router.replace('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : strings.auth.alertGenericMsg;
      setAlert({ visible: true, title: strings.auth.alertProfileErrorTitle, message: msg });
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
          title={strings.auth.roleTitle}
          description={strings.auth.roleSubtitle}
        />

        {/* ── CARDS ────────────────────────────────────── */}
        <View style={styles.cards}>
          <SelectableCard
            title={strings.auth.roleUser}
            description={strings.auth.roleUserDesc}
            isSelected={role === 'client'}
            onPress={() => setRole('client')}
            icon={
              <Ionicons
                name="person"
                size={24}
                color={role === 'client' ? colors.brand.primary : colors.icon.default}
              />
            }
          />

          <SelectableCard
            title={strings.auth.rolePro}
            description={strings.auth.roleProDesc}
            isSelected={role === 'professional'}
            onPress={() => setRole('professional')}
            icon={
              <Ionicons
                name="briefcase"
                size={24}
                color={role === 'professional' ? colors.brand.primary : colors.icon.default}
              />
            }
          />
        </View>

        <View style={styles.spacer} />

        <Button
          label={loading ? 'Guardando...' : strings.auth.continueCta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={role === null || loading}
          onPress={handleContinue}
        />

      </View>

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
  },
  cards: {
    gap: spacing[3],
  },
  spacer: {
    flex: 1,
  },
});
