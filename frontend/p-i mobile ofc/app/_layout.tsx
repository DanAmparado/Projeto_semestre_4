import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const icon = (name: React.ComponentProps<typeof MaterialCommunityIcons>['name']) =>
  ({ color }: { color: any }) => <MaterialCommunityIcons name={name} size={30} color={color} />;

export default function TabsLayout() {
  const { signedIn, loading } = useAuth();
  if (!loading && !signedIn) return <Redirect href='/welcome' />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.rose,
        tabBarInactiveTintColor: '#fff',
        tabBarStyle: { backgroundColor: colors.primary, height: 70, paddingTop: 6, borderTopWidth: 0 },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 10, paddingBottom: 6 },
      }}
    >
      <Tabs.Screen name='home' options={{ title: 'HOME', tabBarIcon: icon('home-heart') }} />
      <Tabs.Screen name='doacoes' options={{ title: 'DOAÇÕES', tabBarIcon: icon('blood-bag') }} />
      <Tabs.Screen name='perfil' options={{ title: 'PERFIL', tabBarIcon: icon('account') }} />
    </Tabs>
  );
}