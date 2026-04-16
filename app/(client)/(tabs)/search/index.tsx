// Screen: SearchScreen (usuario final)
// Capa: screen (silly view)
// Cliente: usuario final
//
// Modo dual controlado por `isSearchActive`:
//   - Query vacío → grid de áreas con counts reales (count_professionals_by_area)
//   - Query con texto → FlatList de profesionales paginados (search_professionals)
//
// El TextInput alimenta tanto el filtro local de áreas (instantáneo) como
// el hook de búsqueda (debounce 300ms → RPC).

import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  AppHeader,
  ScreenHero,
  MiniLoader,
  Placeholder,
} from "@/shared/components";
import { ProfessionalCard } from "@/features/professionals/components/ProfessionalCard";
import { SpecialtyCard } from "@/features/search/components/SpecialtyCard";
import {
  PSYCHOLOGY_AREA_SECTIONS,
  type AreaCard,
  type AreaSection,
} from "@/features/categories/professionalAreaVisual";
import { useSearchProfessionals } from "@/features/search/hooks/useSearchProfessionals";
import { useAreaCounts } from "@/features/search/hooks/useAreaCounts";
import type { ProfessionalListItem } from "@/features/professionals/types";
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

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<RNTextInput>(null);
  const [query, setQuery] = useState("");

  // ── Hooks de data ───────────────────────────────────────────────────────
  const {
    professionals,
    isLoading: searchLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    isSearchActive,
  } = useSearchProfessionals(query);

  const { counts, isLoading: countsLoading } = useAreaCounts();

  // ── Filtro local de áreas (instantáneo, sin debounce) ───────────────────
  const sections = useMemo<AreaSection[]>(() => {
    const q = query.trim().toLocaleLowerCase("es");
    if (!q) return PSYCHOLOGY_AREA_SECTIONS;
    return PSYCHOLOGY_AREA_SECTIONS.map((s) => ({
      ...s,
      data: s.data.filter((a) => {
        const hay = `${a.label} ${a.hint ?? ""}`.toLocaleLowerCase("es");
        return hay.includes(q);
      }),
    })).filter((s) => s.data.length > 0);
  }, [query]);

  const goToArea = (area: AreaCard) => {
    router.push({
      pathname: "/(client)/search/CategoryProfesionalScreen",
      params: {
        categoryId: area.id,
        categoryLabel: area.label,
        iconName: area.iconName,
        iconColor: area.iconColor,
      },
    });
  };

  // ── Render de un resultado de búsqueda ──────────────────────────────────
  const renderProfessional = ({ item }: { item: ProfessionalListItem }) => (
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
          pathname: "/(client)/search/[id]",
          params: { id: item.id, distanceM: String(item.distanceM) },
        })
      }
    />
  );

  return (
    <View style={styles.screen}>
      {/* ── HEADER fijo 56pt ────────────────────────────────────────────── */}
      <AppHeader variant="blue" noBorder />

      {/* ── HERO — título grande + espacio para overlap ─────────────────── */}
      <ScreenHero variant="title" title={strings.search.title} withOverlap />

      {/* ── SEARCH BAR — mitad en azul, mitad en blanco ─────────────────── */}
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[styles.searchBar, getShadow("sm")]}
        accessibilityRole="search"
        accessibilityLabel={strings.home.searchPlaceholder}
      >
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
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.text.tertiary}
            />
          </Pressable>
        )}
      </Pressable>

      {/* ── CONTENIDO DUAL ─────────────────────────────────────────────── */}
      {isSearchActive ? (
        // MODO BÚSQUEDA: FlatList paginada con resultados del RPC
        <FlatList
          data={searchLoading ? [] : professionals}
          keyExtractor={(item) => item.id}
          renderItem={renderProfessional}
          ListEmptyComponent={
            searchLoading ? (
              <View style={resultStyles.loaderWrapper}>
                <MiniLoader label={strings.common.loading} />
              </View>
            ) : (
              <View style={resultStyles.placeholderWrapper}>
                <Placeholder
                  icon={<Ionicons name="search-outline" size={32} color={colors.text.tertiary} />}
                  title={strings.search.noResultsProfessionals}
                  description={strings.search.noResultsHint}
                />
              </View>
            )
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={resultStyles.footerLoader}>
                <MiniLoader label={strings.search.loadingMore} />
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={resultStyles.separator} />}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.5}
          contentContainerStyle={resultStyles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        // MODO ÁREAS: grid de categorías con counts reales
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {sections.length === 0 ? (
            <View style={styles.placeholderWrapper}>
              <Placeholder
                icon={<Ionicons name="search-outline" size={32} color={colors.text.tertiary} />}
                title={strings.home.emptyTitle}
                description="Probá con otra palabra o revisá los grupos completos."
              />
            </View>
          ) : (
            sections.map((section) => (
              <Section
                key={section.title}
                section={section}
                counts={counts}
                countsLoading={countsLoading}
                onPressArea={goToArea}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN — título + grid de 2 columnas (con counts reales)
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  section: AreaSection;
  counts: Record<string, number>;
  countsLoading: boolean;
  onPressArea: (area: AreaCard) => void;
}

function Section({ section, counts, countsLoading, onPressArea }: SectionProps) {
  const rows = useMemo(() => {
    const out: AreaCard[][] = [];
    for (let i = 0; i < section.data.length; i += 2) {
      out.push(section.data.slice(i, i + 2));
    }
    return out;
  }, [section.data]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionMeta}>
        {section.data.length === 1
          ? "1 área"
          : `${section.data.length} áreas`}
      </Text>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((area) => (
            <SpecialtyCard
              key={area.id}
              label={area.label}
              count={counts[area.id] ?? 0}
              showCount={!countsLoading}
              backgroundColor={area.backgroundColor}
              icon={<AreaIcon area={area} />}
              style={styles.card}
              onPress={() => onPressArea(area)}
            />
          ))}
          {row.length === 1 && <View style={styles.cardSpacer} />}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ÍCONO DE ÁREA — Ionicons o letra inicial como fallback
// ─────────────────────────────────────────────────────────────────────────────

function AreaIcon({ area }: { area: AreaCard }) {
  if (area.initial) {
    return (
      <View
        style={[
          iconStyles.initialBadge,
          {
            backgroundColor: area.iconColor + "22",
            borderColor: area.iconColor,
          },
        ]}
      >
        <Text style={[iconStyles.initialText, { color: area.iconColor }]}>
          {area.initial}
        </Text>
      </View>
    );
  }
  return <Ionicons name={area.iconName} size={28} color={area.iconColor} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.screen,
  },
  flex: { flex: 1 },

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
  input: {
    flex: 1,
    ...typography.inputText,
    color: colors.text.primary,
    padding: 0,
  },

  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },

  // Sección (grupo de áreas)
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginBottom: spacing[4],
  },

  // Fila de 2 cards
  row: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  card: {
    minHeight: 130,
  },
  cardSpacer: {
    flex: 1,
  },

  // Placeholder en modo áreas (sin resultados de filtro local)
  placeholderWrapper: {
    paddingTop: spacing[6],
  },
});

// Resultados de búsqueda
const resultStyles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[8],
  },
  separator: {
    height: spacing[3],
  },
  loaderWrapper: {
    paddingTop: spacing[10],
    minHeight: 200,
  },
  placeholderWrapper: {
    paddingTop: spacing[6],
  },
  footerLoader: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
});

const iconStyles = StyleSheet.create({
  initialBadge: {
    width: 44,
    height: 44,
    borderRadius: componentRadius.avatarCircle,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: {
    ...typography.h3,
    fontSize: 22,
    lineHeight: 24,
  },
});
