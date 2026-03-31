import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, componentRadius, layout } from '@/shared/theme';

type IconButtonVariant = 'default' | 'filled' | 'brand';

interface IconButtonProps {
  icon:     React.ReactNode;
  onPress:  () => void;
  variant?: IconButtonVariant;
  size?:    number;           // tamaño del contenedor (default: 44)
  style?:   ViewStyle;
  disabled?: boolean;
}

const bgByVariant: Record<IconButtonVariant, string> = {
  default: colors.palette.transparent,
  filled:  colors.background.subtle,
  brand:   colors.brand.primaryLight,
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant  = 'default',
  size     = layout.touchTargetMin,
  style,
  disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.container,
      {
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: bgByVariant[variant],
        opacity:         pressed ? 0.7 : 1,
      },
      style,
    ]}
  >
    {icon}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
});
