import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Button from '../src/components/Button';
import Logo from '../src/components/Logo';
import { colors } from '../src/theme';

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 120, paddingHorizontal: 40 }}>
      <Logo size={150} />
      <View style={{ height: 64 }} />
      <Button size="lg" label="CRIAR CONTA" color={colors.bright} onPress={() => router.push('/cadastro')} />
      <View style={{ height: 22 }} />
      <Button size="lg" label="FAZER LOGIN" color={colors.dark} onPress={() => router.push('/login')} />
    </View>
  );
}
