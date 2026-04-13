import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/shared/theme';

interface StickyBottomBarProps {
  children:  React.ReactNode;
  style?:    ViewStyle;
  noBorder?: boolean;
  transparent?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  children,
  style,
  noBorder     = false,
  transparent  = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:    insets.bottom + spacing[10],
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
    paddingTop:        spacing[3],
    paddingHorizontal: spacing[4],
    gap:               spacing[2],
  },
});
