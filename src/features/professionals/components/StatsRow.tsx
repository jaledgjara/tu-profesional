import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';

interface Stat {
  value: string | number;
  label: string;
}

interface StatsRowProps {
  stats: Stat[];
}

export const StatsRow: React.FC<StatsRowProps> = ({ stats }) => (
  <View style={[styles.container, getShadow('sm')]}>
    {stats.map((stat, index) => (
      <React.Fragment key={stat.label}>
        <View style={styles.item}>
          <Text style={[typography.statValue, { color: colors.text.primary }]}>
            {stat.value}
          </Text>
          <Text
            style={[
              typography.statLabel,
              { color: colors.text.tertiary, textTransform: 'uppercase' },
            ]}
          >
            {stat.label}
          </Text>
        </View>
        {index < stats.length - 1 && <View style={styles.divider} />}
      </React.Fragment>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection:   'row',
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.statsRow,
    paddingVertical: spacing[3],
  },
  item: {
    flex:           1,
    alignItems:     'center',
    gap:            spacing[0.5],
  },
  divider: {
    width:           1,
    backgroundColor: colors.border.subtle,
    marginVertical:  spacing[1],
  },
});
