// SettingsMenuList
// Renderiza una lista de MenuEntry<T> como cards apiladas con divider.
// Se usa en las pantallas índice de settings/privacy y settings/account.
//
// Por qué existe: evita duplicar el mismo mapeo ActionListItem × 4 en cada
// screen índice. Además, acepta entries `destructive` para pintar el icono
// y label en rojo (eliminar cuenta).

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
} from "@/shared/theme";
import type { MenuEntry } from "@/features/profile/types/menuOptions";

interface SettingsMenuListProps<T extends string> {
  entries: ReadonlyArray<MenuEntry<T>>;
  onSelect: (key: T) => void;
}

export function SettingsMenuList<T extends string>({
  entries,
  onSelect,
}: SettingsMenuListProps<T>) {
  return (
    <View style={[styles.group, getShadow("xs")]}>
      {entries.map((entry, idx) => {
        const isFirst = idx === 0;
        const isLast  = idx === entries.length - 1;
        const tint    = entry.destructive
          ? colors.status.error
          : colors.brand.primary;
        const bg      = entry.destructive
          ? colors.status.errorBg
          : colors.brand.primaryLight;

        return (
          <Pressable
            key={entry.key}
            onPress={() => onSelect(entry.key)}
            style={({ pressed }) => [
              styles.row,
              {
                borderTopLeftRadius:     isFirst ? componentRadius.actionItem : 0,
                borderTopRightRadius:    isFirst ? componentRadius.actionItem : 0,
                borderBottomLeftRadius:  isLast  ? componentRadius.actionItem : 0,
                borderBottomRightRadius: isLast  ? componentRadius.actionItem : 0,
                backgroundColor: pressed
                  ? colors.background.subtle
                  : colors.background.screen,
                borderBottomWidth: isLast ? 0 : 1,
                borderBottomColor: colors.border.subtle,
              },
            ]}
          >
            <View style={[styles.iconCircle, { backgroundColor: bg }]}>
              <Ionicons name={entry.icon} size={20} color={tint} />
            </View>
            <View style={styles.texts}>
              <Text
                style={[
                  typography.bodyMd,
                  {
                    color: entry.destructive
                      ? colors.status.error
                      : colors.text.primary,
                    fontWeight: "600",
                  },
                ]}
              >
                {entry.label}
              </Text>
              <Text
                style={[typography.caption, { color: colors.text.secondary }]}
                numberOfLines={2}
              >
                {entry.description}
              </Text>
            </View>
            <Text style={{ color: colors.icon.inactive, fontSize: 20 }}>›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius:    componentRadius.card,
    overflow:        "hidden",
    backgroundColor: colors.background.card,
  },
  row: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingVertical:   spacing[4],
    paddingHorizontal: spacing[4],
    gap:               spacing[3],
    minHeight:         64,
  },
  iconCircle: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    gap:  spacing[1],
  },
});
