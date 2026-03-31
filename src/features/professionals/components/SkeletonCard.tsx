// Skeleton placeholder mientras cargan los profesionales.
// Sin esto: pantalla en blanco = mayor tasa de abandono.
// Con esto: feedback inmediato de carga.

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import {
  colors, spacing, componentRadius,
} from '@/shared/theme';

const ShimmerBox: React.FC<{ width: number | string; height: number; borderRadius?: number }> = ({
  width, height, borderRadius = componentRadius.sm,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue:         0.9,
          duration:        700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue:         0.3,
          duration:        700,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: colors.border.default,
        opacity,
      }}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <View style={[styles.card]}>
    {/* Avatar + info */}
    <View style={styles.topRow}>
      <ShimmerBox width={44} height={44} borderRadius={22} />
      <View style={styles.infoCol}>
        <ShimmerBox width="80%" height={14} />
        <ShimmerBox width="60%" height={12} />
        <ShimmerBox width="50%" height={12} />
      </View>
    </View>
    {/* Tags */}
    <View style={styles.tagsRow}>
      <ShimmerBox width={70}  height={24} borderRadius={componentRadius.badge} />
      <ShimmerBox width={50}  height={24} borderRadius={componentRadius.badge} />
      <ShimmerBox width={80}  height={24} borderRadius={componentRadius.badge} />
    </View>
    {/* Button */}
    <ShimmerBox width="100%" height={44} borderRadius={componentRadius.button} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.card,
    padding:         spacing[4],
    gap:             spacing[3],
  },
  topRow: {
    flexDirection: 'row',
    gap:           spacing[3],
  },
  infoCol: {
    flex: 1,
    gap:  spacing[1.5],
    paddingTop: spacing[1],
  },
  tagsRow: {
    flexDirection: 'row',
    gap:           spacing[1.5],
  },
});
