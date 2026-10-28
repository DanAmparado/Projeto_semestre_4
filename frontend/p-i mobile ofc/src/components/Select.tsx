import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  error?: string;
  variant?: 'pill' | 'dark' | 'gray';
};

export default function Select({ placeholder, value, options, onChange, error, variant = 'pill' }: Props) {
  const [open, setOpen] = useState(false);
  const box = variant === 'dark' ? styles.dark : variant === 'gray' ? styles.gray : styles.pill;
  return (
    <View style={{ width: '100%', marginBottom: 10 }}>
      <Pressable style={[styles.base, box, error ? { borderColor: '#000' } : null]} onPress={() => setOpen(true)}>
        <Text style={styles.text}>{value || placeholder}</Text>
        <Ionicons name="caret-down" size={14} color={variant === 'gray' ? colors.primary : colors.bright} style={styles.icon} />
      </Pressable>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <FlatList
              data={options}
              keyExtractor={(i) => i}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && { color: colors.primary }]}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 10, paddingHorizontal: 16, justifyContent: 'center' },
  pill: { backgroundColor: colors.pill, borderColor: colors.bright, borderWidth: 2, borderRadius: 999 },
  dark: { backgroundColor: colors.pill, borderColor: '#222', borderWidth: 2, borderRadius: 10 },
  gray: { backgroundColor: colors.card, borderRadius: 999, elevation: 2 },
  text: { fontSize: 14, fontWeight: '700', color: colors.text, textAlign: 'center' },
  icon: { position: 'absolute', right: 16 },
  error: { color: colors.bright, fontSize: 12, marginTop: 3, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 },
  sheet: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '60%', overflow: 'hidden' },
  option: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  optionText: { fontSize: 16, color: colors.text },
});
