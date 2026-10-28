import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

function idade(br: string) {
  const [d, m, y] = br.split('/').map(Number);
  if (!y) return '';
  const hoje = new Date();
  let a = hoje.getFullYear() - y;
  if (hoje < new Date(hoje.getFullYear(), m - 1, d)) a--;
  return `${a} anos`;
}

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <Screen title="PERFIL">
      <View style={styles.card}>
        <View style={styles.avatar} />
        <Text style={styles.name}>{user.nome}</Text>
        <Text style={styles.small}>{[idade(user.dataNascimento), user.genero].filter(Boolean).join(', ')}</Text>

        <View style={styles.badge}>
          <MaterialCommunityIcons name="water" size={16} color="#fff" />
          <Text style={styles.badgeText}>{user.tipoSanguineo ? `TIPO ${user.tipoSanguineo}` : 'TIPO SANGUÍNEO'}</Text>
        </View>

        <View style={{ alignSelf: 'flex-start', marginTop: 18 }}>
          <Text style={styles.info}>CPF: {user.cpf}</Text>
          <Text style={styles.info}>{user.email}</Text>
          <Text style={styles.info}>{user.telefone}</Text>
        </View>

        <View style={styles.helped}>
          <Text style={styles.helpedTitle}>PESSOAS AJUDADAS</Text>
          <Text style={styles.helpedNum}>{String(user.pessoasAjudadas ?? 0).padStart(2, '0')}</Text>
        </View>

        <Button size="sm" label="EDITAR PERFIL" color={colors.black} onPress={() => router.push('/perfil/editar')} style={{ marginTop: 20 }} />
      </View>

      <Pressable
        onPress={async () => { await signOut(); router.replace('/welcome'); }}
        style={{ marginTop: 24 }}
      >
        <Text style={{ color: colors.primary, fontWeight: '800' }}>SAIR DA CONTA</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 10 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#eee', marginTop: -50, elevation: 3 },
  name: { fontWeight: '900', fontSize: 17, marginTop: 12 },
  small: { fontSize: 12, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginTop: 12 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  info: { fontSize: 13, marginBottom: 2 },
  helped: { backgroundColor: colors.rose, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center', marginTop: 18 },
  helpedTitle: { color: colors.primary, fontWeight: '900', fontSize: 11 },
  helpedNum: { color: colors.primary, fontWeight: '900', fontSize: 22 },
});
