// LegalTextScreen
// Screen genérica que renderiza un LegalDocument (título, secciones, disclaimer).
// Usada por las tres rutas bajo app/(professional)/settings/privacy/*.
//
// Layout: AppHeader (blue + back) → ScreenHero (title) → ScrollView con secciones.
// Cada sección: h3 en color primary + body párrafo en text.primary.

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero, IconButton } from "@/shared/components";
import {
  colors,
  spacing,
  typography,
  componentRadius,
} from "@/shared/theme";
import { strings, interpolate } from "@/shared/utils/strings";
import type { LegalDocument } from "@/features/profile/content/legal";

interface LegalTextScreenProps {
  document: LegalDocument;
}

export function LegalTextScreen({ document }: LegalTextScreenProps) {
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
      <ScreenHero variant="title" title={document.title} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.caption, styles.updatedAt]}>
          {interpolate(strings.settings.lastUpdated, {
            date: formatDate(document.updatedAt),
          })}
        </Text>

        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.status.warning}
          />
          <Text style={[typography.bodySm, styles.disclaimerText]}>
            {strings.legal.draftDisclaimer}
          </Text>
        </View>

        {document.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={[typography.h3, styles.heading]}>{section.heading}</Text>
            <Text style={[typography.bodyMd, styles.body]}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Convierte ISO (YYYY-MM-DD) → DD/MM/YYYY. Simple porque todos los docs
// comparten el mismo formato de placeholder.
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
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
  updatedAt: {
    color: colors.text.secondary,
  },
  disclaimer: {
    flexDirection:     "row",
    alignItems:        "flex-start",
    gap:               spacing[2],
    padding:           spacing[3],
    borderRadius:      componentRadius.card,
    backgroundColor:   colors.status.warningBg,
    borderWidth:       1,
    borderColor:       colors.status.warning,
  },
  disclaimerText: {
    flex:  1,
    color: colors.text.primary,
  },
  section: {
    gap: spacing[2],
  },
  heading: {
    color: colors.brand.primary,
  },
  body: {
    color:      colors.text.primary,
    lineHeight: 24,
  },
});
