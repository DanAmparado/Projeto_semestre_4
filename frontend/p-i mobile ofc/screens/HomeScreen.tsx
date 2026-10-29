import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Button from '../components/Button';
import Screen from '../components/Screen';
import { NOTICIAS } from '../data/options';
import { colors } from '../theme';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const cardW = width - 48;
  const [idx, setIdx] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIdx(Math.round(e.nativeEvent.contentOffset.x / (cardW + 12)));

  return (
    <Screen logo contentStyle={{ paddingHorizontal: 24 }}>
      <Text style={styles.h}>NOTÍCIAS NOSSO SANGUE</Text>

      <View style={{ width: cardW, height: 150 }}>
        <FlatList
          data={NOTICIAS}
          horizontal
          pagingEnabled={false}
          snapToInterval={cardW + 12}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(i) => i.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <View style={[styles.news, { width: cardW }]}>
              {/* TODO: trocar pelo banner/imagem vindo da API */}
              <Text style={{ color: '#777', fontWeight: '700' }}>{item.titulo}</Text>
            </View>
          )}
        />
      </View>
      <View style={styles.dots}>
        {NOTICIAS.map((n, i) => (
          <View key={n.id} style={[styles.dot, i === idx && { backgroundColor: colors.primary }]} />
        ))}
      </View>

      <Text style={[styles.h, { marginTop: 36 }]}>CONSULTE NOSSO SANGUE</Text>
      <Text style={styles.sub}>Pesquise a cidade e escolha o hemocentro para ver os níveis de sangue</Text>
      <Button size="sm" label="PESQUISA" pill={false} onPress={() => router.push('/home/consulta')} />

      <Text style={[styles.h, { marginTop: 36 }]}>REQUISITOS PARA DOAR</Text>
      <Text style={styles.sub}>Saiba o que é necessário para você doar sangue</Text>
      <Button size="sm" label="SAIBA MAIS" pill={false} onPress={() => router.push('/home/requisitos')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 17, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 14 },
  sub: { fontSize: 12, textAlign: 'center', marginBottom: 12, maxWidth: 240 },
  news: { height: 150, backgroundColor: colors.card, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
});
