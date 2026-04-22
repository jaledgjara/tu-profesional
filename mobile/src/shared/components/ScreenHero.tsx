import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/shared/theme';

// ─────────────────────────────────────────────────────────────────────────────
// ScreenHero — bloque azul de contexto debajo del AppHeader.
//
// Regla de oro del proyecto:
//   • El AppHeader (56pt) es SIEMPRE la primera capa arriba.
//   • ScreenHero va inmediatamente debajo y hereda el mismo blue700, por lo
//     que visualmente se percibe como un header alto continuo, pero la altura
//     del AppHeader es fija y uniforme en toda la app (igual a auth).
//
// Variantes:
//   • "title"   → h1 grande (home/search/profile/category)
//   • "welcome" → overline "BIENVENIDO/A" + nombre en h2 (solo homes)
//   • children  → slot libre (hero del perfil profesional con avatar centrado)
// ─────────────────────────────────────────────────────────────────────────────

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type ScreenHeroVariant = 'title' | 'welcome';

interface ScreenHeroProps {
  variant?:     ScreenHeroVariant;

  // variant="title"
  title?:       string;
  icon?:        IoniconName;

  // variant="welcome"
  overline?:      string;
  userName?:      string;
  // 'md' (default) → h2 para nombres cortos (full_name del profesional)
  // 'sm'           → h3 + 1 línea con ellipsis para strings largos (email del cliente)
  userNameSize?:  'sm' | 'md';

  // Si la siguiente sección hace overlap (search bar, StatsRow) necesitamos
  // paddingBottom extra para que haya lugar para el marginTop negativo.
  withOverlap?: boolean;

  // Slot libre — si se pasa, ignora las variantes y centra el contenido.
  children?:    React.ReactNode;

  style?:       ViewStyle;
}

export const ScreenHero: React.FC<ScreenHeroProps> = ({
  variant = 'title',
  title,
  icon,
  overline,
  userName,
  userNameSize = 'md',
  withOverlap = false,
  children,
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        withOverlap && styles.containerOverlap,
        !!children && styles.containerCentered,
        style,
      ]}
    >
      {children ? (
        children
      ) : variant === 'welcome' ? (
        <>
          {overline ? (
            <Text style={styles.overline}>{overline}</Text>
          ) : null}
          {userName ? (
            <Text
              style={userNameSize === 'sm' ? styles.userNameSm : styles.userName}
              numberOfLines={1}
              ellipsizeMode="tail">
              {userName}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={styles.titleRow}>
          {icon ? (
            <Ionicons
              name={icon}
              size={28}
              color={colors.text.inverse}
            />
          ) : null}
          {title ? (
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor:   colors.palette.blue700,
    paddingHorizontal: spacing[4],
    paddingTop:        spacing[4],
    paddingBottom:     spacing[6],
  },
  containerOverlap: {
    // espacio para que la siguiente sección haga marginTop negativo
    paddingBottom: spacing[10],
  },
  containerCentered: {
    alignItems: 'center',
    gap:        spacing[2],
  },

  // variant="title"
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[3],
  },
  title: {
    ...typography.h1,
    color: colors.text.inverse,
    flex:  1,
  },

  // variant="welcome"
  overline: {
    ...typography.overline,
    color:         colors.text.inverse,
    textTransform: 'uppercase',
    marginBottom:  spacing[1],
  },
  userName: {
    ...typography.h2,
    color: colors.text.inverse,
  },
  userNameSm: {
    ...typography.h3,
    color: colors.text.inverse,
  },
});
