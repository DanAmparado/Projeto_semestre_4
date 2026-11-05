import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { api } from '../services/api';
import { colors } from '../theme';
import { Notificacao } from '../types';

const dataBr = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

export default function NotificacoesScreen() {
  const [items, setItems] = useState<Notificacao[] | null>(null);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setErro('');
      api.getNotificacoes()
        .then((n) => ativo && setItems(n))
        .catch((e) => ativo && setErro(e.message));
      return () => { ativo = false; };
    }, []),
  );

  const abrir = async (n: Notificacao) => {
    if (n.lida) return;
    setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, lida: true } : x)) ?? null);
    try {
      await api.marcarNotificacaoLida(n.id);
    } catch (e: any) {
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, lida: false } : x)) ?? null);
      setErro(e.message);
    }
  };

  return (
    <Screen title="NOTIFICAÇÕES" showBack>
      {!items && !erro && <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 30 }} />}
      {!!erro && <Text style={{ color: colors.bright, marginTop: 16 }}>{erro}</Text>}
      {items?.length === 0 && <Text style={{ marginTop: 30 }}>Você não tem notificações.</Text>}

      {items?.map((n) => (
        <Pressable key={n.id} onPress={() => abrir(n)} style={[styles.card, !n.lida && styles.unread]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!n.lida && <View style={styles.dot} />}
            <Text style={[styles.title, n.lida && { fontWeight: '600' }]}>{n.titulo}</Text>
          </View>
          <Text style={styles.msg}>{n.mensagem}</Text>
          <Text style={styles.date}>{dataBr(n.created_at)}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginTop: 14 },
  unread: { borderLeftWidth: 5, borderLeftColor: colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  title: { fontWeight: '900', fontSize: 14, flexShrink: 1 },
  msg: { fontSize: 13, marginTop: 6 },
  date: { fontSize: 11, color: '#555', marginTop: 8 },
});
