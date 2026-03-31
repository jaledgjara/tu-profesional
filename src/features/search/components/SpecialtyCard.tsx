import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';

interface SpecialtyCardProps {
  label:           string;
  count:           number;
  icon:            React.ReactNode;
  backgroundColor: string;
  onPress:         () => void;
  style?:          ViewStyle;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({
  label, count, icon, backgroundColor, onPress, style,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      { backgroundColor },
      pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
      style,
    ]}
  >
    <View style={styles.iconArea}>
      {icon}
    </View>
    <Text style={[typography.h4, { color: colors.text.primary }]}>
      {label}
    </Text>
    <Text style={[typography.caption, { color: colors.text.secondary }]}>
      {count} profesionales
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: componentRadius.specialtyCard,
    padding:      spacing[4],
    gap:          spacing[1.5],
    flex:         1,
    minHeight:    130,
  },
  iconArea: {
    marginBottom: spacing[2],
  },
});
