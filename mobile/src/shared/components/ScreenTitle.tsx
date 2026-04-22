import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '@/shared/theme';

interface ScreenTitleProps {
  overline?:    string;
  title:        string;
  description?: string;
  style?:       ViewStyle;
  titleColor?:  string;
}

export const ScreenTitle: React.FC<ScreenTitleProps> = ({
  overline,
  title,
  description,
  style,
  titleColor,
}) => (
  <View style={[styles.container, style]}>
    {overline && (
      <Text style={styles.overline}>{overline}</Text>
    )}
    <Text style={[styles.title, titleColor ? { color: titleColor } : {}]}>
      {title}
    </Text>
    {description && (
      <Text style={styles.description}>{description}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[6],
  },
  overline: {
    ...typography.overline,
    color:         colors.text.brand,
    textTransform: 'uppercase',
    marginBottom:  spacing[1.5],
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  description: {
    ...typography.bodyMd,
    color:      colors.text.secondary,
    marginTop:  spacing[2],
  },
});
