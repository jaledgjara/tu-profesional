// Ruta: /(professional)/profile/settings/privacy
// Índice del submenú "Privacidad y Legales".
// Lista las 3 entradas (PRIVACY_MENU) — el tap navega a la screen de detalle.

import React from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero, IconButton } from "@/shared/components";
import { SettingsMenuList } from "@/features/profile/components/SettingsMenuList";
import {
  PRIVACY_MENU,
  type PrivacyMenuOption,
} from "@/features/profile/types/menuOptions";
import { colors, spacing, typography } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

export default function PrivacySettingsScreen() {
  const handleSelect = (key: PrivacyMenuOption) => {
    router.push(`/(professional)/profile/settings/privacy/${key}` as never);
  };

  return (
    <View style={styles.screen}>
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          <IconButton
            icon={<Ionicons name="chevron-back" size={24} color={colors.text.inverse} />}
            onPress={() => router.back()}
          />
        }
      />
      <ScreenHero variant="title" title={strings.settings.privacyTitle} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.bodyMd, styles.subtitle]}>
          {strings.settings.privacySubtitle}
        </Text>

        <SettingsMenuList entries={PRIVACY_MENU} onSelect={handleSelect} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex:            1,
    backgroundColor: colors.background.screen,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[10],
    gap:               spacing[5],
  },
  subtitle: {
    color: colors.text.secondary,
  },
});
