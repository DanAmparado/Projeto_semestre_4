import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme';

type Props = TextInputProps & { error?: string; variant?: 'pill' | 'dark' };

export default function Input({ error, variant = 'pill', style, ...rest }: Props) {
  return (
    <View style={{ width: '100%', marginBottom: 10 }}>
      <TextInput
        placeholderTextColor="#444"
        style={[styles.input, variant === 'dark' ? styles.dark : styles.pill, error ? { borderColor: '#000' } : null, style]}
        {...rest}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14, fontWeight: '700', color: colors.text },
  pill: { backgroundColor: colors.pill, borderColor: colors.bright, borderWidth: 2, borderRadius: 999, textAlign: 'center' },
  dark: { backgroundColor: colors.pill, borderColor: '#222', borderWidth: 2, borderRadius: 10 },
  error: { color: colors.bright, fontSize: 12, marginTop: 3, textAlign: 'center' },
});
