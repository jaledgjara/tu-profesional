import React, { useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
} from 'react-native';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';

// Supabase Auth OTP: 6 dígitos. El mock de Stitch mostraba 4 — incorrecto.
const OTP_LENGTH = 6;

interface OTPInputProps {
  value:     string;
  onChange:  (code: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  value,
  onChange,
  hasError = false,
  disabled = false,
}) => {
  const inputRef = useRef<TextInput>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  const handleChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(clean);
  };

  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={styles.container}
    >
      {/* Input oculto que captura el teclado */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        caretHidden
        style={styles.hiddenInput}
        editable={!disabled}
        autoFocus
      />

      {/* Celdas visuales */}
      <View style={styles.cellsRow}>
        {digits.map((digit, i) => {
          const isFocused  = i === activeIndex && !disabled;
          const isFilled   = i < value.length;
          const cellBorder = hasError
            ? colors.status.error
            : isFocused
            ? colors.border.focus
            : colors.border.default;

          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  borderColor:     cellBorder,
                  borderWidth:     isFocused ? 2 : 1.5,
                  backgroundColor: isFilled
                    ? colors.brand.primaryLight
                    : colors.background.card,
                },
                isFocused && getShadow('brand'),
              ]}
            >
              <Text
                style={[
                  styles.digit,
                  { color: isFilled ? colors.text.brandDark : colors.text.tertiary },
                ]}
              >
                {digit || (isFocused ? '|' : '')}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity:  0,
    width:    1,
    height:   1,
  },
  cellsRow: {
    flexDirection: 'row',
    gap:           spacing[2],
  },
  cell: {
    width:          48,
    height:         58,
    borderRadius:   componentRadius.otpCell,
    alignItems:     'center',
    justifyContent: 'center',
  },
  digit: {
    ...typography.h2,
    textAlign: 'center',
  },
});
