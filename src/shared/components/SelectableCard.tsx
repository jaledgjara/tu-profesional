import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, componentRadius, getShadow } from '@/shared/theme';

interface SelectableCardProps {
  title:       string;
  description: string;
  icon:        React.ReactNode;
  isSelected:  boolean;
  onPress:     () => void;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  icon,
  isSelected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.card,
      {
        borderColor:     isSelected ? colors.brand.primary : colors.border.card,
        borderWidth:     isSelected ? 2 : 1.5,
        backgroundColor: colors.background.card,
        opacity:         pressed ? 0.95 : 1,
      },
      isSelected ? getShadow('sm') : {},
    ]}
  >
    {/* ICON CIRCLE */}
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: isSelected ? colors.brand.primaryLight : colors.background.subtle },
      ]}
    >
      {icon}
    </View>

    {/* TEXT */}
    <View style={styles.textArea}>
      <Text style={[typography.h4, { color: colors.text.primary }]}>{title}</Text>
      <Text style={[typography.bodySm, { color: colors.text.secondary, marginTop: spacing[0.5] }]}>
        {description}
      </Text>
    </View>

    {/* RADIO BUTTON */}
    <View style={[styles.radioOuter, { borderColor: isSelected ? colors.brand.primary : colors.border.strong }]}>
      {isSelected && <View style={styles.radioInner} />}
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    borderRadius:   componentRadius.selectableCard,
    padding:        spacing[5],
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[4],
  },
  iconCircle: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  textArea: {
    flex: 1,
  },
  radioOuter: {
    width:          22,
    height:         22,
    borderRadius:   11,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  radioInner: {
    width:          11,
    height:         11,
    borderRadius:   5.5,
    backgroundColor: colors.brand.primary,
  },
});
