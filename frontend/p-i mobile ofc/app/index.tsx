import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Logo from '../src/components/Logo';
import { useAuth } from '../src/context/AuthContext';

// Splash: mostra a logo por ~1,8s e redireciona conforme a sessão.
export default function Splash() {
  const { user, loading } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (done && !loading) return <Redirect href={user ? '/home' : '/welcome'} />;

  return (
    <View style={styles.root}>
      <Logo size={240} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' } });
