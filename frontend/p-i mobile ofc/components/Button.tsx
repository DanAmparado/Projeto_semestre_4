import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  size?: 'lg' | 'md' | 'sm';
  loading?: boolean;
  style?: ViewStyle;
  pill?: boolean;
};

export default function Button({ label, onPress, color = colors.primary, size = 'md', loading, style, pill = true }: Props) {
  const pad = size === 'lg' ? 16 : size === 'md' ? 10 : 7;
  const w = size === 'lg' ? '100%' : undefined;
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: color, paddingVertical: pad, borderRadius: pill ? 999 : 8, width: w, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, size === 'sm' && { fontSize: 12 }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
});
