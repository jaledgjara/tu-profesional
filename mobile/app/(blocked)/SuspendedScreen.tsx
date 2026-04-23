// SuspendedScreen — destino del guard cuando authStore.status === 'suspended'.
//
// El user ESTÁ logueado (tiene session + profile) pero el admin marcó
// suspended_at. Por eso vive en (blocked), no en (auth).
//
// Qué ve:
//   - Ícono grande + título "Cuenta suspendida"
//   - Descripción y razón (si el admin la dejó)
//   - Fecha
//   - Dos cards de contacto (WhatsApp + Email) — mismo patrón que
//     contact.tsx. WhatsApp primero porque funciona aunque el dispositivo
//     no tenga cliente de email configurado (caso frecuente en
//     emuladores y muchos teléfonos).
//   - Botón "Cerrar sesión" al pie
//
// El user NO puede saltear: el root guard mapea 'suspended' → esta
// pantalla. Volver a abrir la app, deep-links, etc, todo cae acá.

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "@/shared/components";
import {
  colors,
  typography,
  fontFamilies,
  spacing,
  layout,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAccountActions } from "@/features/auth/hooks/useAccountActions";

// Formato corto en español usando Intl (vive en Hermes sin agregar deps).
function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day:   "numeric",
      month: "short",
      year:  "numeric",
    });
  } catch {
    return iso;
  }
}

export default function SuspendedScreen() {
  const profile = useAuthStore((s) => s.profile) as
    | (ReturnType<typeof useAuthStore.getState>["profile"] & {
        suspended_at?:      string | null;
        suspension_reason?: string | null;
      })
    | null;
  const signOut = useAuthStore((s) => s.signOut);
  const { openContactWhatsApp, openContactEmail } = useAccountActions();

  const suspendedAt = profile?.suspended_at
    ? formatShortDate(profile.suspended_at)
    : null;
  const reason = profile?.suspension_reason ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="alert-circle"
              size={72}
              color={colors.palette.error}
            />
          </View>

          <Text style={styles.title}>Cuenta suspendida</Text>

          <Text style={styles.body}>
            Tu cuenta fue suspendida por el equipo de Tu Profesional. Mientras
            esté suspendida, no vas a poder usar la aplicación.
          </Text>

          {reason ? (
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>Razón</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ) : null}

          {suspendedAt ? (
            <Text style={styles.meta}>Suspendida el {suspendedAt}</Text>
          ) : null}
        </View>

        {/* ── Contactos ────────────────────────────────────────── */}
        <View style={styles.contactBlock}>
          <Text style={styles.contactHeading}>
            Si pensás que es un error, contactanos
          </Text>

          <ContactCard
            icon="logo-whatsapp"
            iconColor={colors.brand.accent}
            iconBg={colors.background.subtle}
            label={strings.contact.whatsappLabel}
            detail={strings.contact.whatsappNumber}
            onPress={openContactWhatsApp}
          />
          <ContactCard
            icon="mail-outline"
            iconColor={colors.brand.primary}
            iconBg={colors.brand.primaryLight}
            label={strings.contact.emailLabel}
            detail={strings.contact.emailAddress}
            onPress={openContactEmail}
          />
        </View>
      </ScrollView>

      {/* ── Logout al pie ──────────────────────────────────────── */}
      <View style={styles.footer}>
        <Button
          label="Cerrar sesión"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={signOut}
        />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// ContactCard (replicada del patrón de /profile/settings/account/contact)
// ─────────────────────────────────────────────────────────────────

interface ContactCardProps {
  icon:      React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg:    string;
  label:     string;
  detail:    string;
  onPress:   () => void;
}

function ContactCard({
  icon, iconColor, iconBg, label, detail, onPress,
}: ContactCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        getShadow("xs"),
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.texts}>
        <Text style={[typography.bodyMd, styles.cardLabel]}>{label}</Text>
        <Text style={[typography.caption, styles.cardDetail]}>{detail}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.icon.inactive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop:        spacing[6],
    paddingBottom:     spacing[6],
    gap:               spacing[6],
  },

  // ── Hero
  hero: {
    alignItems: "center",
    gap: spacing[3],
  },
  iconWrap: {
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: fontFamilies.display.extraBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    color: colors.text.brandDark,
    textAlign: "center",
  },
  body: {
    ...typography.bodyLg,
    color: colors.text.secondary,
    textAlign: "center",
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
  reasonBox: {
    width: "100%",
    padding: spacing[4],
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 16,
    marginTop: spacing[3],
  },
  reasonLabel: {
    ...typography.overline,
    color: colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing[1],
  },
  reasonText: {
    ...typography.bodyMd,
    color: colors.text.primary,
  },
  meta: {
    ...typography.label,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },

  // ── Contactos
  contactBlock: {
    gap: spacing[3],
  },
  contactHeading: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: "center",
    paddingHorizontal: spacing[3],
    marginBottom: spacing[1],
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: componentRadius.card,
    backgroundColor: colors.background.card,
    minHeight: 64,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    gap: spacing[1],
  },
  cardLabel: {
    color: colors.text.primary,
    fontWeight: "600",
  },
  cardDetail: {
    color: colors.text.secondary,
  },

  // ── Footer (logout)
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[4],
    paddingTop: spacing[3],
  },
});
