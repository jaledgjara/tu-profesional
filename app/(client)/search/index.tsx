// Screen: SearchScreen (usuario final)
// Capa: screen (silly view)
// Cliente: usuario final

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import type { ComponentProps } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { SectionRow } from "@/shared/components";
import { SpecialtyCard } from "@/features/search/components/SpecialtyCard";
import { CATEGORIES_CONFIG } from "@/features/categories/config";
import type { CategoryConfig } from "@/features/categories/config";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const inputRef = useRef<RNTextInput>(null);
  const [query, setQuery] = useState("");

  const renderCategory = ({ item }: { item: CategoryConfig }) => (
    <SpecialtyCard
      label={item.label}
      count={item.count}
      showCount={false}
      backgroundColor={item.backgroundColor}
      icon={
        <Ionicons
          name={item.iconName as IoniconName}
          size={30}
          color={item.iconColor}
        />
      }
      style={styles.categoryCard}
      onPress={() =>
        router.push({
          pathname: "/(client)/search/CategoryProfesionalScreen",
          params: {
            categoryId:    item.id,
            categoryLabel: item.label,
            iconName:      item.iconName,
            iconColor:     item.iconColor,
          },
        })
      }
    />
  );

  return (
    <View style={styles.screen}>
      {/* ── HERO — título grande + espacio para overlap ─────────────────── */}
      <View style={[styles.hero, { paddingTop: insets.top + spacing[5] }]}>
        <Text style={styles.title}>{strings.search.title}</Text>
      </View>

      {/* ── SEARCH BAR — mitad en azul, mitad en blanco ─────────────────── */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.searchBar, getShadow("sm")]}
        accessibilityRole="search"
        accessibilityLabel={strings.home.searchPlaceholder}>
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.text.tertiary}
        />
        <RNTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={strings.home.searchPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          autoFocus
          returnKeyType="search"
          style={styles.input}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={strings.common.cancel}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </Pressable>

      {/* ── GRILLA DE CATEGORÍAS ───────────────────────────────────────── */}
      <FlatList
        data={CATEGORIES_CONFIG}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        ListHeaderComponent={
          <SectionRow
            title={strings.home.sectionExplore}
            style={styles.sectionRow}
          />
        }
        renderItem={renderCategory}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },

  // Hero — mismo patrón que home, título grande en blanco
  hero: {
    backgroundColor: colors.palette.blue700,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
  },

  // Search bar — marginTop negativo = mitad en azul, mitad en blanco
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.searchBar,
    marginHorizontal: spacing[4],
    marginTop: -spacing[5],
    paddingHorizontal: spacing[4],
    minHeight: layout.buttonHeightMd,
  },
  input: {
    flex: 1,
    ...typography.inputText,
    color: colors.text.primary,
    padding: 0,
  },

  // List
  sectionRow: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[7],
    marginBottom: spacing[5],
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[10],
  },
  columnWrapper: {
    gap: spacing[3],
  },
  rowSeparator: {
    height: spacing[3],
  },

  // Card compacta: menos alto, menos padding
  categoryCard: {
    minHeight: spacing[12], // 48px base — el contenido determina la altura real
    padding: spacing[3],
  },
});
