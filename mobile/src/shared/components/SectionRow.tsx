import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';

interface SectionRowProps {
  title:        string;
  actionLabel?: string;
  onAction?:    () => void;
  style?:       ViewStyle;
}

export const SectionRow: React.FC<SectionRowProps> = ({
  title, actionLabel, onAction, style,
}) => (
  <View style={[styles.row, style]}>
    <Text style={[typography.h3, { color: colors.text.primary }]}>
      {title}
    </Text>
    {actionLabel && onAction && (
      <Pressable onPress={onAction} hitSlop={8}>
        <Text style={[typography.buttonSm, { color: colors.text.brand }]}>
          {actionLabel}
        </Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    marginBottom:      spacing[3],
  },
});
