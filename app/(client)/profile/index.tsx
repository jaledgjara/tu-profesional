// Screen: ProfileScreen (usuario final)
// Capa: screen (silly view)
// Cliente: usuario final

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // shield-outline, settings-outline
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, TextInput, Button } from "@/shared/components";
import { ActionListItem } from "@/features/profile/components/ActionListItem";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* ── HERO — título grande alineado izquierda (mismo patrón que search) */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing[5] }]}>
        <Text style={styles.title}>{strings.userProfile.title}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* ── AVATAR ──────────────────────────────────────────────────── */}
        <View style={styles.avatarSection}>
          <Avatar name={strings.userProfile.mockName} size="xl" />
        </View>

        {/* ── EMAIL (locked) ──────────────────────────────────────────── */}
        <TextInput
          label={strings.userProfile.email}
          value={strings.userProfile.mockEmail}
          locked
          editable={false}
          onChangeText={() => {}}
        />

        {/* ── OPCIONES ────────────────────────────────────────────────── */}
        <View style={[styles.listGroup, getShadow("xs")]}>
          <ActionListItem
            label={strings.userProfile.privacy}
            icon={
              <Ionicons
                name="shield-outline"
                size={20}
                color={colors.brand.primary}
              />
            }
            onPress={() => {}}
            isFirst
          />
          <ActionListItem
            label={strings.userProfile.moreOptions}
            icon={
              <Ionicons
                name="settings-outline"
                size={20}
                color={colors.brand.primary}
              />
            }
            onPress={() => {}}
            isLast
          />
        </View>

        {/* ── CERRAR SESIÓN ───────────────────────────────────────────── */}
        <View style={styles.logoutWrapper}>
          <Button
            label={strings.userProfile.logout}
            variant="danger"
            size="md"
            fullWidth
            style={styles.logoutBtn}
            labelStyle={styles.logoutLabel}
            onPress={() => {}}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },

  // Hero — idéntico a search pero sin search bar (sin paddingBottom extra)
  hero: {
    backgroundColor:   colors.palette.blue700,
    paddingHorizontal: spacing[4],
    paddingBottom:     spacing[6],
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[6],
    paddingBottom:     layout.stickyBarHeight,
    gap:               spacing[5],
  },

  avatarSection: {
    alignItems: "center",
    paddingBottom: spacing[2],
  },

  listGroup: {
    borderRadius: componentRadius.card,
    overflow: "hidden",
    backgroundColor: colors.background.card,
  },

  logoutWrapper: {
    marginTop: spacing[20],
  },
  logoutBtn: {
    backgroundColor: colors.status.errorBg,
    borderWidth: 1.5,
    borderColor: colors.border.error,
  },
  logoutLabel: {
    color: colors.status.error,
  },
});
