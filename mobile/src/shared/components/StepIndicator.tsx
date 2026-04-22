import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';

interface StepIndicatorProps {
  current: number;
  total:   number;
  style?:  ViewStyle;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  current, total, style,
}) => (
  <View style={[styles.container, style]}>
    <View style={styles.bars}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: i < current
                ? colors.brand.primary
                : colors.border.default,
              flex: 1,
            },
          ]}
        />
      ))}
    </View>
    <Text style={[typography.caption, { color: colors.text.tertiary }]}>
      PASO {current} DE {total}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: spacing[1.5],
  },
  bars: {
    flexDirection: 'row',
    gap:           spacing[1],
    height:        3,
  },
  bar: {
    borderRadius: 2,
  },
});
