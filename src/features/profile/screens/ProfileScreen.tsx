// Screen: ProfileScreen
// Capa: screen (silly view — solo renderiza)
// Clientes: usuario final (variant="client") y profesional (variant="professional")
// Reutilizable en: /(client)/profile, /(professional)/profile
//
// La única diferencia visual entre ambos clientes es el item "Editar mi perfil"
// que solo se renderiza cuando variant === "professional".

import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Avatar, TextInput, Button, AppHeader, ScreenHero } from "@/shared/components";
import { ActionListItem } from "@/features/profile/components/ActionListItem";
import {
  colors,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileScreenProps {
  variant:        "client" | "professional";
  onEditProfile?: () => void;
  onLogout?:      () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export function ProfileScreen({
  variant,
  onEditProfile,
  onLogout,
}: ProfileScreenProps) {
  // Los dos clientes comparten título y label de logout ("Mi Perfil" / "Cerrar sesión")
  // pero las claves están separadas en strings para permitir copy distinto a futuro.
  const copy = variant === "professional" ? strings.proProfile : strings.userProfile;

  const isProfessional = variant === "professional";

  return (
    <View style={styles.screen}>
      {/* ── HEADER 56pt + HERO con título h1 ────────────────────────────── */}
      <AppHeader variant="blue" noBorder />
      <ScreenHero variant="title" title={copy.title} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
          {isProfessional && (
            <ActionListItem
              label="Editar mi perfil"
              icon={
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.brand.primary}
                />
              }
              onPress={onEditProfile ?? (() => {})}
              isFirst
            />
          )}
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
            isFirst={!isProfessional}
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
            label={copy.logout}
            variant="danger"
            size="md"
            fullWidth
            style={styles.logoutBtn}
            labelStyle={styles.logoutLabel}
            onPress={onLogout ?? (() => {})}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS — clonados del original de usuario final, fuente de verdad
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },

  content: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[6],
    paddingBottom:     layout.stickyBarHeight,
    gap:               spacing[5],
  },

  avatarSection: {
    alignItems:    "center",
    paddingBottom: spacing[2],
  },

  listGroup: {
    borderRadius:    componentRadius.card,
    overflow:        "hidden",
    backgroundColor: colors.background.card,
  },

  logoutWrapper: {
    marginTop: spacing[20],
  },
  logoutBtn: {
    backgroundColor: colors.status.errorBg,
    borderWidth:     1.5,
    borderColor:     colors.border.error,
  },
  logoutLabel: {
    color: colors.status.error,
  },
});
