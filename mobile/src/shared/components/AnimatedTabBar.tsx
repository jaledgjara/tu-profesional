import React, { useRef, useEffect, useMemo } from 'react';
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

  // Expo Router traduce `href: null` a `tabBarButton: () => null` internamente.
  // Un custom tabBar tiene que filtrar esas rutas a mano — el default las oculta
  // automáticamente pero acá renderizamos todo, así que las excluimos nosotros.
  const visibleRoutes = useMemo(() => {
    return state.routes.filter((route) => {
      const opts = descriptors[route.key]?.options as
        | { href?: string | null; tabBarButton?: unknown }
        | undefined;
      if (!opts) return true;
      if (opts.href === null) return false;
      if (typeof opts.tabBarButton === 'function') return false;
      return true;
    });
  }, [state.routes, descriptors]);

  const focusedKey = state.routes[state.index]?.key;

  // Una Animated.Value por key (estable entre renders). Si aparece una ruta
  // nueva después del mount, se le crea la suya; las viejas se mantienen.
  const pillAnimsRef = useRef<Map<string, Animated.Value>>(new Map());
  visibleRoutes.forEach((route) => {
    if (!pillAnimsRef.current.has(route.key)) {
      pillAnimsRef.current.set(
        route.key,
        new Animated.Value(route.key === focusedKey ? 1 : 0),
      );
    }
  });

  useEffect(() => {
    visibleRoutes.forEach((route) => {
      const anim = pillAnimsRef.current.get(route.key);
      if (!anim) return;
      Animated.timing(anim, {
        toValue: route.key === focusedKey ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [focusedKey, visibleRoutes]);

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {visibleRoutes.map((route) => {
        const { options } = descriptors[route.key];
        const isFocused = route.key === focusedKey;

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

        const pillAnim = pillAnimsRef.current.get(route.key);

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tab}
          >
            {pillAnim ? (
              <Animated.View
                style={[
                  styles.pill,
                  { backgroundColor: activePillColor, opacity: pillAnim },
                ]}
              />
            ) : null}
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
