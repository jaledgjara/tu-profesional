// Screen: CategoryProfesionalScreen
// Capa: screen (silly view)
// Cliente: usuario final
// Acceso: search/index.tsx → router.push con categoryId, categoryLabel, iconName

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Linking,
} from "react-native";
import type { ComponentProps } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero, IconButton } from "@/shared/components";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { SkeletonCard }     from "@/features/professionals/components/SkeletonCard";
import { useNearbyProfessionals } from "@/features/home/hooks/useNearbyProfessionals";
import type { Professional } from "@/features/professionals/types";
import {
  colors, typography, spacing, componentRadius, getShadow, layout,
} from "@/shared/theme";
import { strings }       from "@/shared/utils/strings";
import { buildWhatsAppUrl } from "@/shared/utils/format";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES (mismos estados que home)
// ─────────────────────────────────────────────────────────────────────────────

const SKELETON_KEYS = [1, 2, 3] as const;

function SkeletonList() {
  return (
    <View style={skeletonStyles.container}>
      {SKELETON_KEYS.map((k) => (
        <SkeletonCard key={k} />
      ))}
    </View>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="search-outline" size={48} color={colors.icon.inactive} />
      <Text style={emptyStyles.title}>{strings.home.emptyTitle}</Text>
      <Text style={emptyStyles.desc}>{strings.home.emptyDesc}</Text>
      <Pressable onPress={onRetry} style={emptyStyles.retryBtn}>
        <Text style={emptyStyles.retryLabel}>{strings.home.retry}</Text>
      </Pressable>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="cloud-offline-outline" size={48} color={colors.status.error} />
      <Text style={emptyStyles.title}>{strings.home.errorTitle}</Text>
      <Text style={emptyStyles.desc}>{strings.home.errorDesc}</Text>
      <Pressable onPress={onRetry} style={emptyStyles.retryBtn}>
        <Text style={emptyStyles.retryLabel}>{strings.home.retry}</Text>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoryProfesionalScreen() {
  const router   = useRouter();
  const inputRef = useRef<RNTextInput>(null);
  const [query, setQuery] = useState("");

  const { categoryLabel, iconName } = useLocalSearchParams<{
    categoryLabel: string;
    iconName:      string;
  }>();

  const { professionals, isLoading, error, refetch } = useNearbyProfessionals();

  const handleContact = (phone: string) => {
    Linking.openURL(buildWhatsAppUrl(phone));
  };

  const renderProfessional = ({ item }: { item: Professional }) => (
    <ProfessionalCard
      id={item.id}
      name={item.name}
      title={item.title}
      specialty={item.specialty}
      zone={item.zone}
      imageUrl={item.imageUrl}
      tags={item.tags}
      rating={item.rating}
      reviewCount={item.reviewCount}
      distanceM={item.distanceM}
      isAvailable={item.isAvailable}
      layout="vertical"
      onPress={() =>
        router.push({ pathname: "/(client)/search/[id]", params: { id: item.id } })
      }
      onContact={() => handleContact(item.phone)}
    />
  );

  const header = (
    <>
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
      <ScreenHero
        variant="title"
        title={categoryLabel}
        icon={iconName ? (iconName as IoniconName) : undefined}
        withOverlap
      />
    </>
  );

  if (error) {
    return (
      <View style={styles.screen}>
        {header}
        <FlatList
          data={[]}
          renderItem={null}
          ListEmptyComponent={<ErrorState onRetry={refetch} />}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {header}

      {/* ── SEARCH BAR — mitad en azul, mitad en blanco ─────────────────── */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.searchBar, getShadow("sm")]}
        accessibilityRole="search"
        accessibilityLabel={strings.home.searchPlaceholder}
      >
        <Ionicons name="search-outline" size={20} color={colors.text.tertiary} />
        <RNTextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          placeholder={strings.home.searchPlaceholder}
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="search"
          style={styles.input}
        />
        {query.length > 0 && (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={strings.common.cancel}
          >
            <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
          </Pressable>
        )}
      </Pressable>

      {/* ── LISTA DE PROFESIONALES ──────────────────────────────────────── */}
      <FlatList
        data={isLoading ? [] : professionals}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        ListEmptyComponent={
          isLoading ? <SkeletonList /> : <EmptyState onRetry={refetch} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    flex:            1,
    backgroundColor: colors.background.screen,
  },

  // Search bar — mismo patrón que search/index
  searchBar: {
    flexDirection:     "row",
    alignItems:        "center",
    gap:               spacing[2],
    backgroundColor:   colors.background.card,
    borderRadius:      componentRadius.searchBar,
    marginHorizontal:  spacing[4],
    marginTop:         -spacing[5],
    paddingHorizontal: spacing[4],
    minHeight:         layout.buttonHeightMd,
  },
  input: {
    flex:    1,
    ...typography.inputText,
    color:   colors.text.primary,
    padding: 0,
  },

  // List
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[8],
  },
  separator: {
    height: spacing[3],
  },
});

// Empty / Error
const emptyStyles = StyleSheet.create({
  container: {
    alignItems:        "center",
    paddingHorizontal: spacing[8],
    paddingTop:        spacing[10],
    gap:               spacing[3],
  },
  title: {
    ...typography.h3,
    color:     colors.text.primary,
    textAlign: "center",
  },
  desc: {
    ...typography.bodyMd,
    color:     colors.text.secondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: spacing[6],
    paddingVertical:   spacing[3],
    borderRadius:      componentRadius.button,
    backgroundColor:   colors.brand.primaryLight,
    minHeight:         layout.buttonHeightMd,
    alignItems:        "center",
    justifyContent:    "center",
  },
  retryLabel: {
    ...typography.buttonMd,
    color: colors.brand.primary,
  },
});

// Skeleton
const skeletonStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    gap:               spacing[3],
    paddingTop:        spacing[2],
  },
});
