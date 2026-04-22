import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, FlatList, StyleSheet,
} from 'react-native';
import {
  colors, typography, spacing, componentRadius, getShadow,
} from '@/shared/theme';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?:       string;
  value?:       string;
  options:      DropdownOption[];
  onSelect:     (value: string) => void;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Seleccionar...',
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <Text
          style={[
            typography.inputText,
            { color: selected ? colors.text.primary : colors.text.tertiary, flex: 1 },
          ]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Text style={{ color: colors.icon.default }}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, getShadow('lg')]}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onSelect(item.value); setOpen(false); }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: pressed ? colors.background.subtle : colors.background.card },
                  ]}
                >
                  <Text
                    style={[
                      typography.bodyMd,
                      {
                        color: item.value === value
                          ? colors.text.brand
                          : colors.text.primary,
                        fontFamily: item.value === value
                          ? typography.buttonMd.fontFamily
                          : typography.bodyMd.fontFamily,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
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
  trigger: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      componentRadius.dropdown,
    borderWidth:       1.5,
    borderColor:       colors.border.default,
    backgroundColor:   colors.background.card,
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    minHeight:         44,
  },
  backdrop: {
    flex:            1,
    backgroundColor: colors.overlay.medium,
    justifyContent:  'center',
    padding:         spacing[6],
  },
  menu: {
    backgroundColor: colors.background.card,
    borderRadius:    componentRadius.modal,
    maxHeight:       300,
    overflow:        'hidden',
  },
  option: {
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
});
