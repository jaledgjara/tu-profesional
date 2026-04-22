import React from 'react';
import {
  Pressable, Text, ActivityIndicator, StyleSheet, View,
  PressableProps, ViewStyle, TextStyle,
} from 'react-native';
import { colors, typography, spacing, componentRadius, getShadow } from '@/shared/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type ButtonSize    = 'lg' | 'md' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?:    ButtonVariant;
  size?:       ButtonSize;
  fullWidth?:  boolean;
  uppercase?:  boolean;
  loading?:    boolean;
  disabled?:   boolean;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  style?:      ViewStyle;
  labelStyle?: TextStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POR VARIANT
// ─────────────────────────────────────────────────────────────────────────────

const variantStyles: Record<ButtonVariant, {
  bg: string; text: string; border?: string; shadow?: boolean;
}> = {
  primary:   { bg: colors.brand.primary,     text: colors.text.inverse,  shadow: true },
  secondary: { bg: colors.brand.primaryLight, text: colors.brand.primary },
  ghost:     { bg: colors.palette.transparent, text: colors.text.secondary, border: colors.border.default },
  outline:   { bg: colors.background.card,   text: colors.text.brandDark, border: colors.border.brand },
  danger:    { bg: colors.palette.transparent, text: colors.text.danger },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN POR SIZE
// ─────────────────────────────────────────────────────────────────────────────

const sizeStyles: Record<ButtonSize, {
  height: number;
  paddingH: number;
  typographyKey: 'buttonLg' | 'buttonMd' | 'buttonSm';
  iconSize: number;
  iconGap: number;
}> = {
  lg: { height: 52, paddingH: spacing[7], typographyKey: 'buttonLg', iconSize: 20, iconGap: spacing[2] },
  md: { height: 44, paddingH: spacing[5], typographyKey: 'buttonMd', iconSize: 17, iconGap: spacing[1.5] },
  sm: { height: 36, paddingH: spacing[3], typographyKey: 'buttonSm', iconSize: 14, iconGap: spacing[1] },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export const Button: React.FC<ButtonProps> = ({
  label,
  variant   = 'primary',
  size      = 'md',
  fullWidth = false,
  uppercase = false,
  loading   = false,
  disabled  = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  onPress,
  ...rest
}) => {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const typo   = typography[sStyle.typographyKey];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height:            sStyle.height,
          paddingHorizontal: sStyle.paddingH,
          backgroundColor:   isDisabled ? colors.palette.sand200 : vStyle.bg,
          borderRadius:      componentRadius.button,
          alignSelf:         fullWidth ? 'stretch' : 'flex-start',
          borderWidth:       vStyle.border ? 1.5 : 0,
          borderColor:       vStyle.border ?? 'transparent',
          opacity:           pressed ? 0.88 : 1,
          transform:         pressed && variant === 'primary'
            ? [{ translateY: 1 }]
            : [{ translateY: 0 }],
        },
        vStyle.shadow && !isDisabled ? getShadow('brand') : {},
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={vStyle.text}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <View style={[styles.inner, { gap: sStyle.iconGap }]}>
          {leftIcon && (
            <View style={{ width: sStyle.iconSize, height: sStyle.iconSize }}>
              {leftIcon}
            </View>
          )}
          <Text
            style={[
              typo,
              {
                color:      isDisabled ? colors.text.tertiary : vStyle.text,
                textTransform: uppercase ? 'uppercase' : 'none',
                flexShrink: 1,
              },
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon && (
            <View style={{ width: sStyle.iconSize, height: sStyle.iconSize }}>
              {rightIcon}
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  inner: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
});
