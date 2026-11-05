import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import { REQUISITOS } from '../data/options';
import { colors } from '../theme';

export default function RequisitosScreen() {
  return (
    <Screen title="REQUISITOS PARA DOAR" showBack>
      <Text style={styles.intro}>
        Conheça o que é necessário para você doar{'\n'}e o que pode impedir a doação.
      </Text>
      {REQUISITOS.map((r) => (
        <View key={r.titulo} style={[styles.card, { backgroundColor: r.cor === 'dark' ? colors.primary : colors.cardRed }]}>
          <Text style={styles.cardTitle}>{r.titulo}</Text>
          {r.itens.map((i) => (
            <Text key={i} style={styles.item}>{i}</Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { textAlign: 'center', fontSize: 13, marginVertical: 16 },
  card: { width: '100%', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { color: '#fff', fontWeight: '900', fontSize: 15, textAlign: 'center', marginBottom: 8 },
  item: { color: '#fff', fontSize: 12, marginBottom: 6 },
});
