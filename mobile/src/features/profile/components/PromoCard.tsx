import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  colors, typography, spacing, componentRadius,
} from '@/shared/theme';

interface PromoCardProps {
  title:    string;
  ctaLabel: string;
  onPress:  () => void;
}

export const PromoCard: React.FC<PromoCardProps> = ({
  title, ctaLabel, onPress,
}) => (
  <View
    style={[
      styles.card,
      { backgroundColor: colors.background.promo },
    ]}
  >
    <Text style={[typography.h3, { color: colors.text.inverse }]}>
      {title}
    </Text>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cta,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <Text
        style={[
          typography.buttonMd,
          { color: colors.text.inverse, textTransform: 'uppercase' },
        ]}
      >
        {ctaLabel}
      </Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: componentRadius.promoCard,
    padding:      spacing[6],
    gap:          spacing[4],
  },
  cta: {
    borderWidth:       1.5,
    borderColor:       colors.text.inverse,
    borderRadius:      componentRadius.button,
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[3],
    alignSelf:         'flex-start',
  },
});
