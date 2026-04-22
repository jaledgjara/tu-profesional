import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, layout } from '@/shared/theme';

type AppHeaderVariant = 'blue' | 'dark' | 'white' | 'transparent';

interface AppHeaderProps {
  title?:        string;
  variant?:      AppHeaderVariant;
  leftAction?:   React.ReactNode;
  rightAction?:  React.ReactNode;   // un solo slot (usar múltiples IconButtons en una View)
  style?:        ViewStyle;
  noBorder?:     boolean;
}

const bgByVariant: Record<AppHeaderVariant, string> = {
  blue:        colors.palette.blue700,   // #1E4785 — nav header, distinct from CTA blue-500
  dark:        colors.background.inverse,
  white:       colors.background.card,
  transparent: colors.palette.transparent,
};

const textByVariant: Record<AppHeaderVariant, string> = {
  blue:        colors.text.inverse,
  dark:        colors.text.inverse,
  white:       colors.text.brandDark,
  transparent: colors.text.brandDark,
};

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  variant   = 'white',
  leftAction,
  rightAction,
  style,
  noBorder = false,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:      insets.top,
          backgroundColor: bgByVariant[variant],
          borderBottomWidth: (variant === 'white' && !noBorder) ? 1 : 0,
          borderBottomColor: colors.border.subtle,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* LEFT SLOT */}
        <View style={styles.side}>
          {leftAction}
        </View>

        {/* TITLE */}
        {title && (
          <Text
            style={[
              typography.h4,
              { color: textByVariant[variant] },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}

        {/* RIGHT SLOT */}
        <View style={[styles.side, styles.rightSide]}>
          {rightAction}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inner: {
    height:         layout.headerHeight,
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: spacing[4],
  },
  side: {
    width:          80,
    flexDirection:  'row',
    alignItems:     'center',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
});
