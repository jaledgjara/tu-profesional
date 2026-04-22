// Ruta: /(client)/settings/account/contact
// Opciones de contacto — misma UI que el profesional.

import React from "react";
import { View, ScrollView, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero, IconButton } from "@/shared/components";
import {
  colors,
  spacing,
  typography,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useAccountActions } from "@/features/auth/hooks/useAccountActions";

export default function ContactScreen() {
  const { openContactWhatsApp, openContactEmail } = useAccountActions();

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
      <ScreenHero variant="title" title={strings.contact.title} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.bodyMd, styles.subtitle]}>
          {strings.contact.subtitle}
        </Text>

        <View style={styles.stack}>
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
    </View>
  );
}

interface ContactCardProps {
  icon:      React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  iconBg:    string;
  label:     string;
  detail:    string;
  onPress:   () => void;
}

function ContactCard({ icon, iconColor, iconBg, label, detail, onPress }: ContactCardProps) {
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
        <Text style={[typography.bodyMd, styles.label]}>{label}</Text>
        <Text style={[typography.caption, styles.detailText]}>{detail}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.icon.inactive} />
    </Pressable>
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
  stack: {
    gap: spacing[3],
  },
  card: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing[3],
    padding:           spacing[4],
    borderRadius:      componentRadius.card,
    backgroundColor:   colors.background.card,
    minHeight:         64,
  },
  iconCircle: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    gap:  spacing[1],
  },
  label: {
    color:      colors.text.primary,
    fontWeight: "600",
  },
  detailText: {
    color: colors.text.secondary,
  },
});
