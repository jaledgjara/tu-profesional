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
import { useDashboardStats } from "@/features/professionals/hooks/useDashboardStats";

export default function ProfessionalHomeScreen() {
  const router = useRouter();

  const sessionEmail     = useAuthStore((s) => s.session?.user.email ?? "");
  const { professional } = useProfessionalProfile();

  const displayName =
    professional?.full_name?.trim() || sessionEmail || "";

  const { profileViews } = useDashboardStats();
  const viewsThisMonth = profileViews?.thisMonth ?? 0;
  const viewsLastMonth = profileViews?.lastMonth ?? 0;

  // Calcular trend: % de cambio vs mes anterior
  // Si lastMonth es 0, no mostrar trend (evitar división por 0)
  const trend = viewsLastMonth > 0
    ? Math.round(((viewsThisMonth - viewsLastMonth) / viewsLastMonth) * 100)
    : null;

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
        {/* ── STAT CARD — visitas al perfil este mes ──────────────── */}
        <View style={styles.statCardRow}>
          <View style={[styles.statCard, getShadow("sm")]}>
            <Text style={styles.statLabel}>
              {strings.dashboard.profileViews}
            </Text>
            <Text style={styles.statValue}>{viewsThisMonth}</Text>
            {trend !== null && (
              <Text
                style={[
                  styles.statTrend,
                  { color: trend >= 0 ? colors.status.success : colors.status.error },
                ]}
              >
                {trend >= 0 ? "↗" : "↘"} {Math.abs(trend)}% vs mes ant.
              </Text>
            )}
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
  statTrend: {
    ...typography.caption,
    marginTop: spacing[1],
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
