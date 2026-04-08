import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/shared/theme';

// ─────────────────────────────────────────────────────────────────────────────
// Switch — toggle reutilizable (iOS-style)
// Usado en: modalidad de trabajo, preferencias, notificaciones.
// ─────────────────────────────────────────────────────────────────────────────

interface SwitchProps {
  value:          boolean;
  onValueChange:  (value: boolean) => void;
  disabled?:      boolean;
  style?:         ViewStyle;
  accessibilityLabel?: string;
}

const TRACK_WIDTH  = 48;
const TRACK_HEIGHT = 28;
const KNOB_SIZE    = 22;
const KNOB_PADDING = 3;

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue:         value ? 1 : 0,
      duration:        180,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.border.strong, colors.brand.primary],
  });

  const knobTranslate = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [KNOB_PADDING, TRACK_WIDTH - KNOB_SIZE - KNOB_PADDING],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.knob,
            { transform: [{ translateX: knobTranslate }] },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width:          TRACK_WIDTH,
    height:         TRACK_HEIGHT,
    borderRadius:   TRACK_HEIGHT / 2,
    justifyContent: 'center',
  },
  knob: {
    width:           KNOB_SIZE,
    height:          KNOB_SIZE,
    borderRadius:    KNOB_SIZE / 2,
    backgroundColor: colors.background.card,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 1 },
    shadowOpacity:   0.15,
    shadowRadius:    2,
    elevation:       2,
  },
});
