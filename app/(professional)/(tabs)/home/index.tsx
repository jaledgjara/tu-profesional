// Screen: ProfessionalHomeScreen
// Capa: screen (silly view — solo renderiza)
// Cliente: profesional

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero } from "@/shared/components";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { ActionListItem } from "@/features/profile/components/ActionListItem";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useProfessionalProfile } from "@/features/professionals/hooks/useProfessionalProfile";

export default function ProfessionalHomeScreen() {
  const router = useRouter();

  const sessionEmail     = useAuthStore((s) => s.session?.user.email ?? "");
  const { professional } = useProfessionalProfile();

  const displayName =
    professional?.full_name?.trim() || sessionEmail || "";

  return (
    <View style={styles.screen}>
      {/* ── HEADER (56pt fijo, igual que auth) ─────────────────────────── */}
      <AppHeader variant="blue" noBorder />

      {/* ── HERO welcome — continúa el azul del header ─────────────────── */}
      <ScreenHero
        variant="welcome"
        overline={strings.home.welcomeLabel}
        userName={displayName}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* ── STAT CARD ─────────────────────────────────────────────── */}
        <View style={styles.statCardRow}>
          <View style={[styles.statCard, getShadow("sm")]}>
            <Text style={styles.statLabel}>Visitas al perfil</Text>
            <Text style={styles.statValue}>0</Text>
          </View>
        </View>

        {/* ── ACCIONES RÁPIDAS ──────────────────────────────────────── */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>ACCIONES RÁPIDAS</Text>

          <View style={[styles.actionsContainer, getShadow("xs")]}>
            <ActionListItem
              label="Ver mi perfil"
              icon={
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.brand.primary}
                />
              }
              onPress={() => router.push("/(professional)/briefcase")}
              isFirst
              style={styles.actionItem}
            />
            <ActionListItem
              label="Editar mi perfil"
              icon={
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.brand.primary}
                />
              }
              onPress={() => router.push("/(professional)/profile")}
              isLast
              style={styles.actionItem}
            />
          </View>
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

  // ── Scroll content ───────────────────────────────────────────────────────
  content: {
    paddingTop: spacing[6],
    paddingBottom: spacing[8],
  },

  // ── Stat card ────────────────────────────────────────────────────────────
  statCardRow: {
    paddingHorizontal: layout.screenPaddingH,
    alignItems: "center",
  },
  statCard: {
    width: "50%",
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.card,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    alignItems: "center",
    gap: spacing[1],
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.text.secondary,
    textAlign: "center",
  },
  statValue: {
    ...typography.h2,
    color: colors.text.primary,
  },

  // ── Acciones rápidas ─────────────────────────────────────────────────────
  actionsSection: {
    paddingHorizontal: layout.screenPaddingH,
    marginTop: spacing[10],
    gap: spacing[3],
  },
  sectionLabel: {
    ...typography.overline,
    color: colors.text.tertiary,
    textTransform: "uppercase",
  },
  actionsContainer: {
    borderRadius: componentRadius.actionItem,
    overflow: "hidden",
  },
  actionItem: {
    paddingVertical: spacing[5],
  },
});
