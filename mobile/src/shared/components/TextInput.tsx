import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput as RNTextInput, StyleSheet,
  Pressable, Animated, TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native';
import {
  colors, typography, spacing, componentRadius, layout,
} from '@/shared/theme';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?:         string;
  errorMessage?:  string;
  helperText?:    string;
  leftIcon?:      React.ReactNode;
  leftPrefix?:    string;          // "Lic.", "+54", etc.
  rightIcon?:     React.ReactNode;
  locked?:        boolean;         // campo no editable (muestra candado)
  containerStyle?: ViewStyle;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  errorMessage,
  helperText,
  leftIcon,
  leftPrefix,
  rightIcon,
  locked = false,
  containerStyle,
  onFocus,
  onBlur,
  editable = true,
  ...rest
}) => {
  const [focused, setFocused] = useState(false);

  const hasError  = !!errorMessage;
  const isEnabled = editable && !locked;

  // Border color según estado
  const borderColor = hasError
    ? colors.border.error
    : focused
    ? colors.border.focus
    : colors.border.default;

  const bgColor = locked || !editable
    ? colors.background.subtle
    : focused
    ? colors.background.card
    : colors.background.card;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* LABEL */}
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      {/* INPUT CONTAINER */}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: bgColor,
            borderRadius: componentRadius.input,
            // Focus ring simulado con border más grueso
            borderWidth: focused ? 2 : 1.5,
          },
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        {leftPrefix && (
          <View style={styles.leftPrefixContainer}>
            <Text style={styles.leftPrefix}>{leftPrefix}</Text>
            <View style={styles.prefixDivider} />
          </View>
        )}

        <RNTextInput
          style={[
            styles.input,
            typography.inputText,
            { color: isEnabled ? colors.text.primary : colors.text.tertiary },
          ]}
          placeholderTextColor={colors.text.tertiary}
          editable={isEnabled}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}

        {/* Candado para campos locked */}
        {locked && (
          <View style={styles.rightIcon}>
            {/* Reemplazar con vector icon */}
            <Text style={{ color: colors.icon.inactive }}>🔒</Text>
          </View>
        )}
      </View>

      {/* ERROR / HELPER */}
      {(errorMessage || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: hasError ? colors.status.error : colors.text.tertiary },
          ]}
        >
          {errorMessage ?? helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing[3],
  },
  label: {
    ...typography.inputLabel,
    textTransform:  'uppercase',
    color:          colors.text.secondary,
    marginBottom:   spacing[1.5],
  },
  inputContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    overflow:       'hidden',
    minHeight:      layout.buttonHeightMd,
  },
  input: {
    flex:              1,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    minHeight:         layout.buttonHeightMd,
  },
  leftIcon: {
    paddingLeft:  spacing[4],
    paddingRight: spacing[2],
  },
  leftPrefixContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingLeft:   spacing[4],
  },
  leftPrefix: {
    ...typography.inputText,
    color:        colors.text.secondary,
    paddingRight: spacing[2],
  },
  prefixDivider: {
    width:          1.5,
    height:         22,
    backgroundColor: colors.border.default,
    marginRight:    spacing[2],
  },
  rightIcon: {
    paddingRight: spacing[3],
    paddingLeft:  spacing[2],
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing[1],
  },
});
