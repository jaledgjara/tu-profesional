import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, typography, spacing, radius, layout } from '@/shared/theme';

interface AnimatedTabBarProps extends BottomTabBarProps {
  activeTintColor?: string;
  activePillColor?: string;
}

export function AnimatedTabBar({
  state,
  descriptors,
  navigation,
  activeTintColor = colors.icon.active,
  activePillColor = colors.brand.primaryLight,
}: AnimatedTabBarProps) {
  const insets = useSafeAreaInsets();

  const pillAnims = useRef(
    state.routes.map((_, i) => new Animated.Value(i === state.index ? 1 : 0)),
  ).current;

  useEffect(() => {
    state.routes.forEach((_, i) => {
      Animated.timing(pillAnims[i], {
        toValue: i === state.index ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const label =
          typeof options.tabBarLabel === 'string'
            ? options.tabBarLabel
            : (options.title ?? route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tab}
          >
            <Animated.View
              style={[
                styles.pill,
                { backgroundColor: activePillColor, opacity: pillAnims[index] },
              ]}
            />
            {options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? activeTintColor : colors.icon.inactive,
              size: 24,
            })}
            <Text
              style={[
                styles.label,
                { color: isFocused ? activeTintColor : colors.icon.inactive },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  tab: {
    flex: 1,
    height: layout.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: spacing[1],
    left: spacing[3],
    right: spacing[3],
    bottom: spacing[1],
    borderRadius: radius.lg,
  },
  label: {
    ...typography.caption,
    marginTop: spacing[0.5],
  },
});
