// Screen: HomeScreen (usuario final)
// Capa: screen (silly view — solo renderiza, lógica en hook)
// Cliente: usuario final

import React from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  SectionRow,
  MiniLoader,
  Placeholder,
} from "@/shared/components";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { useNearbyProfessionals } from "@/features/home/hooks/useNearbyProfessionals";
import type { ProfessionalListItem } from "@/features/professionals/types";
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
import { formatCategory } from "@/shared/utils/format";

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { professionals, isLoading, error, refetch } = useNearbyProfessionals();
  const email = useAuthStore((s) => s.session?.user.email ?? "");
  const displayName = email.split("@")[0];

  const renderProfessional = ({ item }: { item: ProfessionalListItem }) => (
    <View style={styles.cardWrapper}>
    <ProfessionalCard
      id={item.id}
      name={item.fullName}
      title={formatCategory(item.category) || item.specialty}
      specialty={item.specialty}
      zone={item.city}
      imageUrl={item.photoUrl}
      tags={item.subSpecialties.slice(0, 3)}
      distanceM={item.distanceM}
      layout="vertical"
      onPress={() =>
        router.push({
          pathname: "/(client)/home/[id]",
          params: { id: item.id, distanceM: String(item.distanceM) },
        })
      }
    />
    </View>
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

      {/* ── SECCIÓN TÍTULO ─────────────────────────────────────────────── */}
      <SectionRow
        title={strings.home.sectionNearby}
        actionLabel={strings.home.seeAll}
        onAction={() => router.push("/(client)/search")}
        style={styles.sectionRow}
      />
    </>
  );

  // ── Estado error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.screen}>
        <AppHeader variant="blue" noBorder />
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.placeholderWrapper}>
              <Placeholder
                icon={<Ionicons name="cloud-offline-outline" size={32} color={colors.status.error} />}
                title={strings.home.errorTitle}
                description={strings.home.errorDesc}
                actionLabel={strings.home.retry}
                onAction={refetch}
              />
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // ── Estado cargando ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.screen}>
        <AppHeader variant="blue" noBorder />
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.loaderWrapper}>
              <MiniLoader label={strings.common.loading} />
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // ── Estado con datos o vacío ────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <AppHeader variant="blue" noBorder />
      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.placeholderWrapper}>
            <Placeholder
              icon={<Ionicons name="search-outline" size={32} color={colors.text.tertiary} />}
              title={strings.home.emptyTitle}
              description={strings.home.emptyDesc}
              actionLabel={strings.home.retry}
              onAction={refetch}
            />
          </View>
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
    minHeight: layout.buttonHeightMd,
  },
  searchPlaceholder: {
    ...typography.inputText,
    color: colors.text.tertiary,
    flex: 1,
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
  cardWrapper: {
    paddingHorizontal: spacing[4],
  },
  separator: {
    height: spacing[3],
  },

  // Placeholder / Loader wrappers
  placeholderWrapper: {
    paddingTop: spacing[6],
  },
  loaderWrapper: {
    paddingTop: spacing[10],
    minHeight: 200,
  },
});
