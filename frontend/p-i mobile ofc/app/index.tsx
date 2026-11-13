import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

// Splash: mostra a logo por ~1,8s e redireciona conforme a sessão.
export default function Splash() {
  const { signedIn, loading } = useAuth();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (done && !loading) return <Redirect href={signedIn ? '/home' : '/welcome'} />;

  return (
    <View style={styles.root}>
      <Logo size={240} />
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});