import { router, Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme';

const TabIcon = ({ tipo, color }: { tipo: 'home' | 'doacoes' | 'perfil'; color: ColorValue }) => {
  console.log('[TabIcon] Renderizando ícone SVG:', { tipo, color });  if (tipo === 'home') {
    return (
      <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
        <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </Svg>
    );
  }
  if (tipo === 'doacoes') {
    return (
      <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
        <Path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
      </Svg>
    );
  }
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </Svg>
  );
};

export default function TabsLayout() {
  const { signedIn, loading } = useAuth();
  const insets = useSafeAreaInsets();
  console.log('[TabsLayout] Montado! Insets bottom:', insets.bottom);

  useEffect(() => {
    if (!loading && !signedIn) {
      router.replace('/welcome');
    }
  }, [loading, signedIn]);

  if (loading || !signedIn) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: {
          backgroundColor: colors.primary,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 6,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'HOME', tabBarIcon: ({ color }) => <TabIcon tipo="home" color={color} /> }}
      />
      <Tabs.Screen
        name="doacoes"
        options={{ title: 'DOAÇÕES', tabBarIcon: ({ color }) => <TabIcon tipo="doacoes" color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'PERFIL', tabBarIcon: ({ color }) => <TabIcon tipo="perfil" color={color} /> }}
      />
    </Tabs>
  );
}