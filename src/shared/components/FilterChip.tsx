import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing, componentRadius } from '@/shared/theme';

interface FilterChipProps {
  label:      string;
  isSelected: boolean;
  onPress:    () => void;
  badge?:     string;   // texto superpuesto tipo "PRONTO"
  disabled?:  boolean;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  isSelected,
  onPress,
  badge,
  disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.chip,
      {
        backgroundColor: isSelected
          ? colors.brand.primary
          : colors.background.card,
        borderColor: isSelected
          ? colors.brand.primary
          : colors.border.default,
        opacity: pressed ? 0.85 : 1,
      },
    ]}
  >
    <Text
      style={[
        typography.buttonSm,
        {
          color: isSelected ? colors.text.inverse : colors.text.secondary,
          textTransform: 'none',
        },
      ]}
    >
      {label}
    </Text>

    {/* Badge "PRONTO" superpuesto */}
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    position:          'relative',
    borderRadius:      componentRadius.filterChip,
    borderWidth:       1.5,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[2],
    flexDirection:     'row',
    alignItems:        'center',
  },
  badge: {
    position:        'absolute',
    top:             -6,
    right:           -2,
    backgroundColor: colors.brand.accent,
    borderRadius:    componentRadius.badge,
    paddingHorizontal: spacing[1],
    paddingVertical:   2,
  },
  badgeText: {
    ...typography.label,
    color:         colors.text.inverse,
    fontSize:      8,
    textTransform: 'uppercase',
  },
});
