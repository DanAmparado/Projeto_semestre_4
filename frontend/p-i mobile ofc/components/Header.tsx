import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import Logo from './Logo';

type Props = { title?: string; showBack?: boolean; logo?: boolean };

export default function Header({ title, showBack, logo }: Props) {
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
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.bar}>
        <View style={styles.sideLeft}>
          {showBack && (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="#fff">
                <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </Svg>
            </Pressable>
          )}
        </View>

        <View style={styles.center}>
          {logo ? <Logo size={56} showName={false} /> : <Text style={styles.title}>{title}</Text>}
        </View>

        <View style={styles.sideRight}>
          {signedIn && (
            <Pressable onPress={confirmarLogout} hitSlop={12}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="#fff">
                <Path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </Svg>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.primary,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  sideLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});