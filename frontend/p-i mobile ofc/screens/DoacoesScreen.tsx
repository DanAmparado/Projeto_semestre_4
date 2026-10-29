import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../components/Button';
import Screen from '../components/Screen';
import { api } from '../services/api';
import { colors } from '../theme';
import { Doacao } from '../types';

export default function DoacoesScreen() {
  const [items, setItems] = useState<Doacao[] | null>(null);
  const [erro, setErro] = useState('');

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setErro('');
      api.getDoacoes()
        .then((d) => ativo && setItems(d))
        .catch((e) => ativo && setErro(e.message));
      return () => { ativo = false; };
    }, []),
  );

  return (
    <Screen title="MINHAS DOAÇÕES">
      <Text style={styles.intro}>
        Consulte suas doações feitas.{'\n'}Sua solidariedade faz o Nosso Sangue fluir!
      </Text>

      {!items && !erro && <ActivityIndicator color={colors.primary} size="large" />}
      {!!erro && <Text style={{ color: colors.bright }}>{erro}</Text>}
      {items?.length === 0 && <Text style={{ marginVertical: 20 }}>Você ainda não registrou doações.</Text>}

      {items?.map((d) => (
        <View key={d.id} style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DATA</Text>
            <Text style={styles.value}>{d.data}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>LOCAL</Text>
            <Text style={styles.value} numberOfLines={1}>{d.local}</Text>
          </View>
        </View>
      ))}

      {items && <Button label="DOAR NOVAMENTE" onPress={() => router.push('/doacoes/requisitos')} style={{ marginTop: 20 }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { textAlign: 'center', fontSize: 13, marginTop: 20, marginBottom: 24 },
  card: { width: '100%', flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 14 },
  label: { fontWeight: '900', fontSize: 11 },
  value: { fontSize: 13 },
});
