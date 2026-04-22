import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';

interface MetricCardProps {
  label:          string;
  value:          number | string;
  trend?:         number;         // positivo = verde, negativo = rojo
  trendPositive?: boolean;        // override manual si el trend no es numérico
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label, value, trend, trendPositive,
}) => {
  const isPositive = trendPositive ?? (trend !== undefined && trend >= 0);
  const trendColor = isPositive ? colors.status.success : colors.status.error;
  const trendPrefix = trend !== undefined && trend >= 0 ? '+' : '';

  return (
    <View style={[styles.card, getShadow('sm')]}>
      <Text
        style={[
          typography.statLabel,
          { color: colors.text.secondary, textTransform: 'uppercase' },
        ]}
      >
        {label}
      </Text>
      <Text style={[typography.statValue, { color: colors.text.primary }]}>
        {value}
      </Text>
      {trend !== undefined && (
        <Text style={[typography.caption, { color: trendColor }]}>
          ↗ {trendPrefix}{trend}% vs sem. ant.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.metricCard,
    padding:         spacing[4],
    gap:             spacing[1],
  },
});
