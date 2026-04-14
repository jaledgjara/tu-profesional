import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/shared/theme';

interface StickyBottomBarProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  noBorder?: boolean;
  transparent?: boolean;
  /**
   * Reduce el padding vertical para liberar espacio al contenido scrolleable.
   * Pensado para pantallas de edición donde el usuario quiere ver más campos
   * de una sin scroll extra. El safe area inset se respeta siempre.
   */
  compact?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  children,
  style,
  noBorder     = false,
  transparent  = false,
  compact      = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          // Modo compact: paddingTop y paddingBottom simétricos respecto al
          // safe area inset → el botón queda visualmente centrado dentro del
          // rectángulo blanco del footer, aun con home indicator en iPhone.
          paddingTop:       compact ? insets.bottom + spacing[1] : spacing[3],
          paddingBottom:    insets.bottom + (compact ? spacing[1] : spacing[10]),
          backgroundColor:  transparent ? colors.palette.transparent : colors.background.card,
          borderTopWidth:   noBorder ? 0 : 1,
          borderTopColor:   colors.border.subtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    gap:               spacing[2],
  },
});
