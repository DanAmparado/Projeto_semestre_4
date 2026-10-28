import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import Logo from './Logo';

type Props = { title?: string; showBack?: boolean; logo?: boolean };

export default function Header({ title, showBack, logo }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 10 }]} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
      )}
      {logo ? <Logo size={56} showName={false} /> : <Text style={styles.title}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.primary, paddingBottom: 14, alignItems: 'center', justifyContent: 'center', minHeight: 64 },
  title: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
  back: { position: 'absolute', left: 12, zIndex: 2 },
});
