// Screen: SearchScreen (usuario final)
// Capa: screen (silly view)
// Cliente: usuario final
//
// Muestra las 23 áreas de especialización agrupadas en 5 secciones (enfoque
// teórico, población, área temática, neuropsicología, aplicada). Cada área
// es una card con ícono de Ionicons (o letra inicial como fallback) y color
// cohesionado por grupo. Tap → CategoryProfesionalScreen con el slug del área.
//
// Por qué SectionList/ScrollView manual en vez de FlatList con numColumns:
//   SectionList no soporta numColumns, y con 23 ítems no hay riesgo de perf
//   que justifique virtualizar. Un ScrollView mapeado es mucho más legible.

import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput as RNTextInput,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader, ScreenHero } from "@/shared/components";
import { SpecialtyCard } from "@/features/search/components/SpecialtyCard";
import {
  PSYCHOLOGY_AREA_SECTIONS,
  type AreaCard,
  type AreaSection,
} from "@/features/categories/professionalAreaVisual";
import {
  colors,
  typography,
  spacing,
  componentRadius,
  getShadow,
  layout,
} from "@/shared/theme";
import { strings } from "@/shared/utils/strings";

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router   = useRouter();
  const inputRef = useRef<RNTextInput>(null);
  const [query, setQuery] = useState("");

  // Filtro local sobre el catálogo completo — búsqueda en label + hint.
  // Devuelve las secciones con sus data filtradas; oculta secciones vacías.
  const sections = useMemo<AreaSection[]>(() => {
    const q = query.trim().toLocaleLowerCase("es");
    if (!q) return PSYCHOLOGY_AREA_SECTIONS;
    return PSYCHOLOGY_AREA_SECTIONS
      .map((s) => ({
        ...s,
        data: s.data.filter((a) => {
          const hay = `${a.label} ${a.hint ?? ""}`.toLocaleLowerCase("es");
          return hay.includes(q);
        }),
      }))
      .filter((s) => s.data.length > 0);
  }, [query]);

  const goToArea = (area: AreaCard) => {
    router.push({
      pathname: "/(client)/search/CategoryProfesionalScreen",
      params: {
        categoryId:    area.id,
        categoryLabel: area.label,
        iconName:      area.iconName,
        iconColor:     area.iconColor,
      },
    });
  };

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

      {/* ── ÁREAS AGRUPADAS ────────────────────────────────────────────── */}
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {sections.length === 0 ? (
          <EmptyQueryState />
        ) : (
          sections.map((section) => (
            <Section key={section.title} section={section} onPressArea={goToArea} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECCIÓN — título + grid de 2 columnas
// ─────────────────────────────────────────────────────────────────────────────

interface SectionProps {
  section:     AreaSection;
  onPressArea: (area: AreaCard) => void;
}

function Section({ section, onPressArea }: SectionProps) {
  // Agrupamos los items en pairs para renderizar filas de 2 cards.
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
              count={0}
              showCount={false}
              backgroundColor={area.backgroundColor}
              icon={<AreaIcon area={area} />}
              style={styles.card}
              onPress={() => onPressArea(area)}
            />
          ))}
          {/* Spacer si la fila tiene un solo elemento (nro impar de áreas). */}
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
          { backgroundColor: area.iconColor + "22", borderColor: area.iconColor },
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
// EMPTY — query no matchea ninguna área
// ─────────────────────────────────────────────────────────────────────────────

function EmptyQueryState() {
  return (
    <View style={emptyStyles.wrapper}>
      <Ionicons
        name="search-outline"
        size={40}
        color={colors.icon.inactive}
      />
      <Text style={emptyStyles.title}>Sin resultados</Text>
      <Text style={emptyStyles.desc}>
        Probá con otra palabra o revisá los grupos completos.
      </Text>
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
  flex: { flex: 1 },

  // Search bar — marginTop negativo = mitad en azul, mitad en blanco
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

  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[6],
    paddingBottom:     spacing[10],
  },

  // Sección (grupo)
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    ...typography.h3,
    color:        colors.text.primary,
    marginBottom: spacing[1],
  },
  sectionMeta: {
    ...typography.caption,
    color:        colors.text.tertiary,
    marginBottom: spacing[4],
  },

  // Fila de 2 cards
  row: {
    flexDirection: "row",
    gap:           spacing[3],
    marginBottom:  spacing[3],
  },
  card: {
    minHeight: 130,
  },
  cardSpacer: {
    flex: 1,
  },
});

const iconStyles = StyleSheet.create({
  initialBadge: {
    width:          44,
    height:         44,
    borderRadius:   componentRadius.avatarCircle,
    borderWidth:    1.5,
    alignItems:     "center",
    justifyContent: "center",
  },
  initialText: {
    ...typography.h3,
    fontSize:   22,
    lineHeight: 24,
  },
});

const emptyStyles = StyleSheet.create({
  wrapper: {
    alignItems:  "center",
    gap:         spacing[2],
    paddingTop:  spacing[10],
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  desc: {
    ...typography.bodyMd,
    color:     colors.text.secondary,
    textAlign: "center",
  },
});
