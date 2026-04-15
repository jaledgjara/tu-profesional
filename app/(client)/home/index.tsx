// Screen: HomeScreen (usuario final)
// Capa: screen (silly view — solo renderiza, lógica en hook)
// Cliente: usuario final

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  FilterChip,
  SectionRow,
} from "@/shared/components";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { SkeletonCard } from "@/features/professionals/components/SkeletonCard";
import { PSYCHOLOGY_CATEGORIES } from "@/features/categories/types";
import type { PsychologyCategoryId } from "@/features/categories/types";
import { useNearbyProfessionals } from "@/features/home/hooks/useNearbyProfessionals";
import type { Professional } from "@/features/professionals/types";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";
import { buildWhatsAppUrl } from "@/shared/utils/format";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTES PRIVADOS
// ─────────────────────────────────────────────────────────────────────────────

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
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color={colors.status.error}
      />
      <Text style={emptyStyles.title}>{strings.home.errorTitle}</Text>
      <Text style={emptyStyles.desc}>{strings.home.errorDesc}</Text>
      <Pressable onPress={onRetry} style={emptyStyles.retryBtn}>
        <Text style={emptyStyles.retryLabel}>{strings.home.retry}</Text>
      </Pressable>
    </View>
  );
}

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

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { professionals, isLoading, error, refetch } = useNearbyProfessionals();
  const [selectedCategory, setSelectedCategory] =
    useState<PsychologyCategoryId>("todos");
  const email = useAuthStore((s) => s.session?.user.email ?? "");
  const displayName = email.split("@")[0];

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
        router.push({
          pathname: "/(client)/home/[id]",
          params: { id: item.id },
        })
      }
      onContact={() => handleContact(item.phone)}
    />
  );

  const listHeader = (
    <>
      {/* ── HERO welcome con overlap para la search bar ────────────────── */}
      <ScreenHero
        variant="welcome"
        overline={strings.home.welcomeLabel}
        userName={displayName}
        userNameSize="sm"
        withOverlap
      />

      {/* ── SEARCH BAR BUTTON (overlap sobre el hero) ──────────────────── */}
      <Pressable
        onPress={() => router.push("/(client)/search")}
        style={({ pressed }) => [
          styles.searchBar,
          getShadow("sm"),
          pressed && { opacity: 0.9 },
        ]}
        accessibilityRole="search"
        accessibilityLabel={strings.home.searchPlaceholder}>
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.text.tertiary}
        />
        <Text style={styles.searchPlaceholder}>
          {strings.home.searchPlaceholder}
        </Text>
      </Pressable>

      {/* ── CATEGORÍAS ─────────────────────────────────────────────────── */}
      <FlatList
        horizontal
        data={PSYCHOLOGY_CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            isSelected={selectedCategory === item.id}
            onPress={() => setSelectedCategory(item.id)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesList}
      />

      {/* ── SECCIÓN TÍTULO ─────────────────────────────────────────────── */}
      <SectionRow
        title={strings.home.sectionNearby}
        actionLabel={strings.home.seeAll}
        onAction={() => router.push("/(client)/search")}
        style={styles.sectionRow}
      />
    </>
  );

  // Estado error
  if (error) {
    return (
      <View style={styles.screen}>
        <AppHeader variant="blue" noBorder />
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<ErrorState onRetry={refetch} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader variant="blue" noBorder />
      <FlatList
        data={isLoading ? [] : professionals}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        ListHeaderComponent={listHeader}
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
    flex: 1,
    backgroundColor: colors.background.screen,
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    backgroundColor: colors.background.card,
    borderRadius: componentRadius.searchBar,
    marginHorizontal: spacing[4],
    marginTop: -spacing[5],
    paddingHorizontal: spacing[4],
    minHeight: layout.buttonHeightMd, // 44 — Apple HIG
  },
  searchPlaceholder: {
    ...typography.inputText,
    color: colors.text.tertiary,
    flex: 1,
  },

  // Categories
  categoriesList: {
    marginTop: spacing[5],
  },
  categoriesContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },

  // Section
  sectionRow: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[1],
  },

  // List
  listContent: {
    paddingBottom: spacing[8],
  },
  separator: {
    height: spacing[3],
  },
});

// Empty / Error
const emptyStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: spacing[8],
    paddingTop: spacing[10],
    gap: spacing[3],
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  desc: {
    ...typography.bodyMd,
    color: colors.text.secondary,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: componentRadius.button,
    backgroundColor: colors.brand.primaryLight,
    minHeight: layout.buttonHeightMd,
    alignItems: "center",
    justifyContent: "center",
  },
  retryLabel: {
    ...typography.buttonMd,
    color: colors.brand.primary,
  },
});

// Skeleton list
const skeletonStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    paddingTop: spacing[2],
  },
});
