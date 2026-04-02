import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import {
  AppHeader,
  IconButton,
  ScreenTitle,
  SelectableCard,
  Button,
} from '@/shared/components';
import { colors, spacing, layout } from '@/shared/theme';
import { strings } from '@/shared/utils/strings';

type Role = 'user' | 'professional' | null;

export default function UserTypeScreen() {
  const [role, setRole] = useState<Role>(null);

  const handleContinue = () => {
    if (role === 'user') {
      router.push('/(auth)/ClientLocationFormScreen');
    } else {
      router.push('/(auth)/ProfessionalFormScreen');
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
            isSelected={role === 'user'}
            onPress={() => setRole('user')}
            icon={
              <Ionicons
                name="person"
                size={24}
                color={role === 'user' ? colors.brand.primary : colors.icon.default}
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
          label={strings.auth.continueCta}
          variant="primary"
          size="lg"
          fullWidth
          disabled={role === null}
          onPress={handleContinue}
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
  cards: {
    gap: spacing[3],
  },
  spacer: {
    flex: 1,
  },
});
