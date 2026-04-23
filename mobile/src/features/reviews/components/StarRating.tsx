// Component: StarRating
// Capa: feature component (no va a shared/ porque solo lo consume `reviews`)
//
// Dos modos:
//   - Readonly (readOnly=true o sin onChange): render plano, sin Pressables.
//     Se usa en ReviewCard (size=16) y AllReviewsScreen (size=20).
//
//   - Editable (onChange presente): cada estrella es un Pressable de 44x44
//     mínimo (Apple HIG — invariante #6). Se usa en WriteReviewScreen (size=40).
//
// Colores: amarillo #FBBF24 para filled, border.default para vacías. El amarillo
// es el único hex hardcodeado — no existe como token porque es el color universal
// de las estrellas (cross-platform convention). Si algún día se tokeniza, cambiar
// a `colors.accent.star` o similar.

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { colors, spacing } from "@/shared/theme";

const STAR_FILLED = "#FBBF24";
const STAR_COUNT  = 5;

// Tamaño mínimo del hit target (Apple HIG)
const HIT_TARGET_MIN = 44;

interface StarRatingProps {
  /** Valor actual 0-5. 0 = ninguna estrella. */
  value:     number;
  /** Callback cuando se toca una estrella. Si no se pasa, el componente es readonly. */
  onChange?: (next: number) => void;
  /** Tamaño de la estrella en pt. Default 32. */
  size?:     number;
  /** Fuerza readonly aunque se pase onChange (útil para estados disabled). */
  readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  size = 32,
  readOnly = false,
}) => {
  const editable = !!onChange && !readOnly;

  return (
    <View style={styles.row}>
      {Array.from({ length: STAR_COUNT }).map((_, i) => {
        const filled = i < value;
        const star = (
          <Text
            style={{
              fontSize: size,
              color:    filled ? STAR_FILLED : colors.border.default,
              // line-height igual al size para que no agregue padding vertical invisible
              lineHeight: size,
            }}>
            ★
          </Text>
        );

        if (!editable) {
          return <View key={i}>{star}</View>;
        }

        return (
          <Pressable
            key={i}
            onPress={() => onChange!(i + 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${i + 1} ${i === 0 ? "estrella" : "estrellas"}`}
            accessibilityState={{ selected: filled }}
            style={styles.touchTarget}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap:           spacing[1],
  },
  touchTarget: {
    minWidth:       HIT_TARGET_MIN,
    minHeight:      HIT_TARGET_MIN,
    alignItems:     "center",
    justifyContent: "center",
  },
});
