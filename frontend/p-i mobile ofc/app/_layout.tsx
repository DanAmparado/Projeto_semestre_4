import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const icon = (name: React.ComponentProps<typeof MaterialCommunityIcons>['name']) =>
  ({ color }: { color: any }) => <MaterialCommunityIcons name={name} size={30} color={color} />;

export default function TabsLayout() {
  const { loading } = useAuth();
  const segments = useSegments();
  const first = (segments[0] ?? '') as string;
  const isAuthScreen = ['welcome', 'login', 'signup', 'index', ''].includes(first);

  if (loading) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: isAuthScreen
          ? { display: 'none' }
          : { backgroundColor: colors.primary, height: 70, paddingTop: 6, borderTopWidth: 0 },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 10, paddingBottom: 6 },
      }}
    >
      <Tabs.Screen name='home' options={{ title: 'HOME', tabBarIcon: icon('home-heart') }} />
      <Tabs.Screen name='doacoes' options={{ title: 'DOAÇÕES', tabBarIcon: icon('blood-bag') }} />
      <Tabs.Screen name='perfil' options={{ title: 'PERFIL', tabBarIcon: icon('account') }} />
      <Tabs.Screen name='welcome' options={{ href: null }} />
      <Tabs.Screen name='login' options={{ href: null }} />
      <Tabs.Screen name='signup' options={{ href: null }} />
      <Tabs.Screen name='index' options={{ href: null }} />
    </Tabs>
  );
}