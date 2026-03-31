import React from 'react';
import {
  Pressable, View, Text, StyleSheet, ViewStyle,
} from 'react-native';
import { colors, typography, spacing, componentRadius } from '@/shared/theme';

interface ActionListItemProps {
  label:     string;
  icon:      React.ReactNode;
  onPress:   () => void;
  isFirst?:  boolean;
  isLast?:   boolean;
  style?:    ViewStyle;
}

export const ActionListItem: React.FC<ActionListItemProps> = ({
  label, icon, onPress, isFirst, isLast, style,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.item,
      {
        borderTopLeftRadius:     isFirst ? componentRadius.actionItem : 0,
        borderTopRightRadius:    isFirst ? componentRadius.actionItem : 0,
        borderBottomLeftRadius:  isLast ? componentRadius.actionItem : 0,
        borderBottomRightRadius: isLast ? componentRadius.actionItem : 0,
        backgroundColor: pressed
          ? colors.background.subtle
          : colors.background.screen,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border.subtle,
      },
      style,
    ]}
  >
    <View style={styles.iconCircle}>
      {icon}
    </View>
    <Text style={[typography.bodyMd, { flex: 1, color: colors.text.primary }]}>
      {label}
    </Text>
    <Text style={{ color: colors.icon.inactive }}>›</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  item: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:   spacing[4],
    paddingHorizontal: spacing[4],
    gap:            spacing[3],
  },
  iconCircle: {
    width:          38,
    height:         38,
    borderRadius:   19,
    backgroundColor: colors.brand.primaryLight,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
