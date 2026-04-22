// Screen: CategoryProfesionalScreen
// Capa: screen (silly view)
// Cliente: usuario final
// Acceso: search/index.tsx → router.push con categoryId, categoryLabel, iconName
//
// Muestra profesionales filtrados por área con infinite scroll (cursor keyset).
// Usa useProfessionalsByArea que internamente llama al RPC professionals_by_area.
//
// Estados:
//   isLoading  → MiniLoader
//   error      → Placeholder con retry
//   vacío      → Placeholder informativo
//   datos      → FlatList con onEndReached para paginación

import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import type { ComponentProps } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  IconButton,
  MiniLoader,
  Placeholder,
} from "@/shared/components";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { useProfessionalsByArea } from "@/features/search/hooks/useProfessionalsByArea";
import type { ProfessionalListItem } from "@/features/professionals/types";
import { colors, spacing } from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function CategoryProfesionalScreen() {
  const router = useRouter();

  const { categoryId, categoryLabel, iconName } = useLocalSearchParams<{
    categoryId: string;
    categoryLabel: string;
    iconName: string;
  }>();

  const {
    professionals,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  } = useProfessionalsByArea(categoryId);

  const renderProfessional = ({ item }: { item: ProfessionalListItem }) => (
    <ProfessionalCard
      id={item.id}
      name={item.fullName}
      title={item.specialty}
      specialty={item.specialty}
      zone={item.city}
      imageUrl={item.photoUrl}
      tags={item.subSpecialties.slice(0, 3)}
      distanceM={item.distanceM}
      layout="vertical"
      onPress={() =>
        router.push({
          pathname: "/(client)/search/[id]",
          params: { id: item.id, distanceM: String(item.distanceM) },
        })
      }
    />
  );

  const header = (
    <>
      <AppHeader
        variant="blue"
        noBorder
        leftAction={
          <IconButton
            icon={
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.text.inverse}
              />
            }
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

  // ── Estado error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.stateWrapper}>
          <Placeholder
            icon={<Ionicons name="cloud-offline-outline" size={32} color={colors.status.error} />}
            title={strings.home.errorTitle}
            description={strings.home.errorDesc}
            actionLabel={strings.home.retry}
            onAction={refetch}
          />
        </View>
      </View>
    );
  }

  // ── Estado cargando ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.loaderWrapper}>
          <MiniLoader label={strings.common.loading} />
        </View>
      </View>
    );
  }

  // ── Estado con datos o vacío ────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {header}

      <FlatList
        data={professionals}
        keyExtractor={(item) => item.id}
        renderItem={renderProfessional}
        ListEmptyComponent={
          <View style={styles.stateWrapper}>
            <Placeholder
              icon={<Ionicons name="search-outline" size={32} color={colors.text.tertiary} />}
              title={strings.home.emptyTitle}
              description={strings.home.emptyDesc}
              actionLabel={strings.home.retry}
              onAction={refetch}
            />
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <MiniLoader label={strings.search.loadingMore} />
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
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

  // List
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
  },
  separator: {
    height: spacing[3],
  },

  // States
  stateWrapper: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },
  loaderWrapper: {
    flex: 1,
    paddingTop: spacing[10],
  },
  footerLoader: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
});
