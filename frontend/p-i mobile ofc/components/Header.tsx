import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import Logo from './Logo';

type Props = { title?: string; showBack?: boolean; logo?: boolean };

export default function Header({ title, showBack, logo }: Props) {
  const insets = useSafeAreaInsets();
  const { signedIn, signOut } = useAuth();

  const confirmarLogout = () => {
    Alert.alert('Sair da conta?', 'Você precisará fazer login novamente.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/welcome');
        },
      },
    ]);
  };

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 12 }]}>
      {showBack && (
        <Pressable onPress={() => router.back()} style={[styles.back, { top: 12 }]} hitSlop={12}>
          <Ionicons name='chevron-back' size={26} color='#fff' />
        </Pressable>
      )}
      {logo ? <Logo size={56} showName={false} /> : <Text style={styles.title}>{title}</Text>}
      {signedIn && (
        <Pressable onPress={confirmarLogout} style={[styles.logout, { top: 12 }]} hitSlop={12}>
          <MaterialCommunityIcons name='logout' size={22} color='#fff' />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.primary, paddingBottom: 14, alignItems: 'center', justifyContent: 'center', minHeight: 64 },
  title: { color: '#fff', fontWeight: '800', fontSize: 17, letterSpacing: 0.3 },
  back: { position: 'absolute', left: 12, zIndex: 2 },
  logout: { position: 'absolute', right: 14, zIndex: 2 },
});