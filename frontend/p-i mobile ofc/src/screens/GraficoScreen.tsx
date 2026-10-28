import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import BloodChart from '../components/BloodChart';
import Button from '../components/Button';
import Input from '../components/Input';
import Screen from '../components/Screen';
import Select from '../components/Select';
import { ESTADOS } from '../data/options';
import { api } from '../services/api';
import { colors } from '../theme';
import { NivelSangue } from '../types';

export default function GraficoScreen() {
  const params = useLocalSearchParams<{ cidade?: string; estado?: string }>();
  const [cidade, setCidade] = useState(params.cidade ?? '');
  const [estado, setEstado] = useState(params.estado ?? '');
  const [data, setData] = useState<NivelSangue[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const buscar = useCallback(async (c: string, e: string) => {
    if (!c.trim() || !e) return setErro('Informe a cidade e o estado.');
    try {
      setErro('');
      setLoading(true);
      setData(await api.getNiveis(c.trim(), e));
    } catch (err: any) {
      setErro(err.message || 'Não foi possível carregar os níveis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.cidade && params.estado) buscar(params.cidade, params.estado);
  }, [params.cidade, params.estado, buscar]);

  return (
    <Screen title="CONSULTA NOSSO SANGUE" showBack>
      <Text style={{ textAlign: 'center', fontSize: 11, marginBottom: 14, maxWidth: 280 }}>
        Pesquise a cidade e escolha o hemocentro para ver os níveis de sangue.{'\n'}
        Sua doação faz a diferença para o nosso futuro!
      </Text>
      <Input placeholder="CIDADE" value={cidade} onChangeText={setCidade} style={{ backgroundColor: '#D9D9D9', borderWidth: 0, width: 200, alignSelf: 'center' }} />
      <Select variant="gray" placeholder="ESTADO" value={estado} options={ESTADOS} onChange={setEstado} />
      <Button label="PESQUISAR" size="sm" pill={false} onPress={() => buscar(cidade, estado)} />

      <View style={{ width: '100%', marginTop: 24 }}>
        {loading && <ActivityIndicator color={colors.primary} size="large" />}
        {!!erro && <Text style={{ color: colors.bright, textAlign: 'center' }}>{erro}</Text>}
        {data && !loading && <BloodChart data={data} />}
      </View>
    </Screen>
  );
}
