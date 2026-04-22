// Ruta: /(professional)/settings/account/notifications
// Preferencias de notificación — 3 switches con save optimista.

import React from "react";
import { View, ScrollView, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  IconButton,
  Switch,
  MiniLoader,
} from "@/shared/components";
import {
  colors,
  spacing,
  typography,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { useNotificationPrefs } from "@/features/profile/hooks/useNotificationPrefs";
import type { NotificationPrefs } from "@/shared/services/accountService";

interface Row {
  key:   keyof NotificationPrefs;
  label: string;
  desc:  string;
}

const ROWS: ReadonlyArray<Row> = [
  { key: "platformUpdates", label: strings.notifications.platformUpdates, desc: strings.notifications.platformUpdatesDesc },
  { key: "billing",         label: strings.notifications.billing,         desc: strings.notifications.billingDesc         },
  { key: "tips",            label: strings.notifications.tips,            desc: strings.notifications.tipsDesc            },
];

export default function NotificationsScreen() {
  const { prefs, isLoading, toggle } = useNotificationPrefs();

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
      <ScreenHero variant="title" title={strings.notifications.title} />

      {isLoading ? (
        <MiniLoader />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[typography.bodyMd, styles.subtitle]}>
            {strings.notifications.subtitle}
          </Text>

          <View style={[styles.group, getShadow("xs")]}>
            {ROWS.map((row, idx) => {
              const isLast = idx === ROWS.length - 1;
              return (
                <View
                  key={row.key}
                  style={[styles.row, !isLast && styles.rowDivider]}
                >
                  <View style={styles.texts}>
                    <Text style={[typography.bodyMd, styles.label]}>
                      {row.label}
                    </Text>
                    <Text style={[typography.caption, styles.desc]}>
                      {row.desc}
                    </Text>
                  </View>
                  <Switch
                    value={prefs[row.key]}
                    onValueChange={() => toggle(row.key)}
                    accessibilityLabel={row.label}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
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
  group: {
    borderRadius:    componentRadius.card,
    overflow:        "hidden",
    backgroundColor: colors.background.card,
  },
  row: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing[3],
    paddingVertical:   spacing[4],
    paddingHorizontal: spacing[4],
    minHeight:         64,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  texts: {
    flex: 1,
    gap:  spacing[1],
  },
  label: {
    color:      colors.text.primary,
    fontWeight: "600",
  },
  desc: {
    color: colors.text.secondary,
  },
});
