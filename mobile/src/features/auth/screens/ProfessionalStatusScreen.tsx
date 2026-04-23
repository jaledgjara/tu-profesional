// ProfessionalStatusScreen — pantalla post-onboarding del profesional.
//
// Render:
//   - Primer fetch (status === null) → loader fullscreen (sin estado mentiroso).
//   - pending  → "En revisión" (hourglass). Sin botón al home.
//   - approved → "Aprobado" (check). Sin CTA: el authStore ya está authenticated
//                y la próxima navegación natural (back, otro guard) lo lleva al
//                dashboard. En este momento solo informamos.
//   - rejected → "Rechazado" (close) + motivo. Botón "Volver a empezar" que
//                hace signOut y lleva al WelcomeScreen para reintentar.
//
// La lógica vive en useMyProfessionalStatus. Esta screen es silly view.

import { useCallback } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/shared/components";
import {
  colors,
  typography,
  spacing,
  layout,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { useAuthStore } from "@/features/auth/store/authStore";

import {
  useMyProfessionalStatus,
} from "@/features/auth/hooks/useMyProfessionalStatus";
import type { ProfessionalStatus } from "@/features/auth/services/professionalStatusService";

// ─────────────────────────────────────────────────────────────────
// Config visual por estado — cada uno define su ícono, copy y color
// ─────────────────────────────────────────────────────────────────

interface StatusConfig {
  icon:     keyof typeof Ionicons.glyphMap;
  iconBg:   string;
  iconTint: string;
  title:    string;
  subtitle: string;
}

const STATUS_CONFIG: Record<ProfessionalStatus, StatusConfig> = {
  pending: {
    icon:     "hourglass-outline",
    iconBg:   colors.status.warningBg,
    iconTint: colors.status.warning,
    title:    "Tu perfil está en revisión",
    subtitle:
      "Nuestro equipo está verificando tus datos. Suele demorar menos de 24 horas. " +
      "Te avisamos apenas se apruebe.",
  },
  approved: {
    icon:     "checkmark-circle",
    iconBg:   colors.status.successBg,
    iconTint: colors.status.success,
    title:    "¡Tu perfil fue aprobado!",
    subtitle:
      "Ya apareces en el listado público y los usuarios pueden encontrarte. " +
      "Completá lo que falte y empezá a recibir consultas.",
  },
  rejected: {
    icon:     "close-circle",
    iconBg:   colors.status.errorBg,
    iconTint: colors.status.error,
    title:    "Tu solicitud fue rechazada",
    subtitle:
      "No pudimos aprobar tu perfil en esta revisión. Mirá el motivo abajo. " +
      "Podés volver a empezar el registro cuando tengas los datos corregidos.",
  },
};

// ─────────────────────────────────────────────────────────────────

export default function ProfessionalStatusScreen() {
  const insets  = useSafeAreaInsets();
  const signOut = useAuthStore((s) => s.signOut);

  const { status, rejectionReason, isLoading, refresh } = useMyProfessionalStatus();

  const handleStartOver = useCallback(async () => {
    // "Volver a empezar" = desautenticarse y volver al Welcome del flow de auth.
    await signOut();
    router.replace("/(auth)/WelcomeScreen");
  }, [signOut]);

  // ── Loader inicial (antes del primer fetch) ────────────────────
  if (status === null) {
    return (
      <View
        style={[
          styles.container,
          styles.loaderContainer,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.loaderText}>Consultando estado de tu perfil…</Text>
      </View>
    );
  }

  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing[6], paddingBottom: insets.bottom + spacing[6] },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={56} color={config.iconTint} />
        </View>

        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>{config.subtitle}</Text>

        {status === "rejected" && rejectionReason ? (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>MOTIVO</Text>
            <Text style={styles.rejectionText}>{rejectionReason}</Text>
          </View>
        ) : null}

        {/* Link "Actualizar" solo para pending — en approved/rejected la
            info ya es definitiva y no cambia sola. */}
        {status === "pending" ? (
          isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={styles.loaderTextInline}>Consultando estado…</Text>
            </View>
          ) : (
            <Pressable onPress={refresh} hitSlop={8} style={styles.refreshRow}>
              <Ionicons name="refresh" size={16} color={colors.text.brand} />
              <Text style={styles.refreshText}>Actualizar estado</Text>
            </Pressable>
          )
        ) : null}
      </ScrollView>

      {/* ── Footer condicional según estado ─────────────────────── */}
      {status === "rejected" ? (
        <View style={styles.footer}>
          <Button
            label="Volver a empezar"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleStartOver}
          />
        </View>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex:              1,
    backgroundColor:   colors.background.screen,
    paddingHorizontal: layout.screenPaddingH,
  },
  loaderContainer: {
    alignItems:     "center",
    justifyContent: "center",
    gap:            spacing[3],
  },
  loaderText: {
    ...typography.bodyMd,
    color: colors.text.secondary,
  },
  scrollContent: {
    flexGrow:       1,
    justifyContent: "center",
    alignItems:     "center",
    paddingBottom:  spacing[8],
  },
  iconCircle: {
    width:          112,
    height:         112,
    borderRadius:   componentRadius.avatarCircle,
    alignItems:     "center",
    justifyContent: "center",
    marginBottom:   spacing[6],
    ...getShadow("sm"),
  },
  title: {
    ...typography.h1,
    color:        colors.text.primary,
    textAlign:    "center",
    marginBottom: spacing[3],
    maxWidth:     layout.maxContentWidth,
  },
  subtitle: {
    ...typography.bodyLg,
    color:     colors.text.secondary,
    textAlign: "center",
    maxWidth:  320,
  },
  rejectionBox: {
    width:             "100%",
    maxWidth:          layout.maxContentWidth,
    padding:           spacing[4],
    marginTop:         spacing[6],
    backgroundColor:   colors.status.errorBg,
    borderRadius:      componentRadius.card,
    borderLeftWidth:   3,
    borderLeftColor:   colors.status.error,
  },
  rejectionLabel: {
    ...typography.overline,
    color:            colors.status.error,
    textTransform:    "uppercase",
    marginBottom:     spacing[1],
  },
  rejectionText: {
    ...typography.bodyMd,
    color: colors.text.primary,
  },
  loaderRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           spacing[2],
    marginTop:     spacing[6],
  },
  loaderTextInline: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  refreshRow: {
    flexDirection:   "row",
    alignItems:      "center",
    gap:             spacing[1],
    marginTop:       spacing[6],
    paddingVertical: spacing[2],
  },
  refreshText: {
    ...typography.buttonSm,
    color: colors.text.brand,
  },
  footer: {
    paddingTop: spacing[4],
  },
});
