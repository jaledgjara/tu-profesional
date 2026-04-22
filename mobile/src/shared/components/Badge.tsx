import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, componentRadius } from '@/shared/theme';

// tag: para clasificación/taxonomía (especialidades, zonas, modalidades)
// status-*: para estados funcionales (suscripción, verificación, disponibilidad)
type BadgeVariant =
  | 'tag'
  | 'status-blue'
  | 'status-jade'
  | 'status-success'
  | 'status-warning'
  | 'status-error';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string; border?: string }> = {
  'tag':            { bg: colors.background.card, text: colors.text.secondary, border: colors.border.default },
  'status-blue':    { bg: colors.palette.blue100,  text: colors.palette.blue700 },
  'status-jade':    { bg: colors.palette.jade100,  text: colors.palette.jade700 },
  'status-success': { bg: colors.status.successBg, text: colors.status.success },
  'status-warning': { bg: colors.status.warningBg, text: colors.status.warning },
  'status-error':   { bg: colors.status.errorBg,   text: colors.status.error },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'tag',
  icon,
  style,
}) => {
  const v = variantMap[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: v.bg,
          borderRadius:    componentRadius.badge,
          borderWidth:     v.border ? 1 : 0,
          borderColor:     v.border ?? 'transparent',
        },
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          typography.label,
          { color: v.text, textTransform: 'uppercase' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[2],
  },
  icon: {
    marginRight: spacing[1],
  },
});
