import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, componentRadius, getShadow } from '@/shared/theme';

interface InfoSectionProps {
  title:     string;
  onEdit?:   () => void;
  children:  React.ReactNode;
  style?:    ViewStyle;
  noPadding?: boolean;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  title, onEdit, children, style, noPadding = false,
}) => (
  <View
    style={[
      styles.container,
      getShadow('sm'),
      style,
    ]}
  >
    <View style={styles.header}>
      <Text style={[typography.h4, { color: colors.text.primary }]}>{title}</Text>
      {onEdit && (
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={[typography.buttonSm, { color: colors.text.brand }]}>
            EDITAR
          </Text>
        </Pressable>
      )}
    </View>
    <View style={noPadding ? {} : styles.content}>
      {children}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.infoSection,
    padding:         spacing[4],
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing[3],
  },
  content: {},
});
