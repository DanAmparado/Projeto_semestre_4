import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { levelColors } from '../theme';
import { NivelSangue } from '../types';

const H = 200;
const TICKS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];

export const levelOf = (n: number) =>
  n < 25 ? levelColors.emergencial : n < 50 ? levelColors.critico : n < 75 ? levelColors.estavel : levelColors.suficiente;

export default function BloodChart({ data }: { data: NivelSangue[] }) {
  return (
    <View style={{ width: '100%' }}>
      <Text style={styles.axisTitle}>ESTOQUE IDEAL DE SANGUE (%)</Text>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ height: H, justifyContent: 'space-between', marginRight: 6 }}>
          {TICKS.map((t) => (
            <Text key={t} style={styles.tick}>{t}%</Text>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.plot}>
            {TICKS.map((t) => (
              <View key={t} style={[styles.grid, { bottom: (t / 100) * H }]} />
            ))}
            {data.map((d) => (
              <View key={d.tipo} style={styles.col}>
                <View style={[styles.bar, { height: (Math.min(d.nivel, 100) / 100) * H, backgroundColor: levelOf(d.nivel) }]} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row' }}>
            {data.map((d) => (
              <Text key={d.tipo} style={styles.label}>{d.tipo}</Text>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.legendTitle}>LEGENDA: EM QUAL MEDIDA ESTÁ O SANGUE</Text>
      <View style={styles.legend}>
        {[
          ['Emergencial', levelColors.emergencial],
          ['Estado crítico', levelColors.critico],
          ['Estável', levelColors.estavel],
          ['Suficiente', levelColors.suficiente],
        ].map(([name, c]) => (
          <View key={name} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: c }]} />
            <Text style={styles.legendText}>{name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisTitle: { fontSize: 9, fontWeight: '800', marginBottom: 6 },
  tick: { fontSize: 9, fontWeight: '700', lineHeight: 10 },
  plot: { height: H, flexDirection: 'row', borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#000' },
  grid: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: '#ddd' },
  col: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '55%' },
  label: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', marginTop: 4 },
  legendTitle: { textAlign: 'center', fontSize: 10, fontWeight: '800', marginTop: 20 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 8, gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontWeight: '700' },
});
