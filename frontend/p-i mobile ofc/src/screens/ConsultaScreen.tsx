import { router } from 'expo-router';
import React, { useState } from 'react';
import { Text } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import Screen from '../components/Screen';
import Select from '../components/Select';
import { ESTADOS } from '../data/options';

export default function ConsultaScreen() {
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [erro, setErro] = useState('');

  const buscar = () => {
    if (!cidade.trim() || !estado) return setErro('Informe a cidade e o estado.');
    setErro('');
    router.push({ pathname: '/home/grafico', params: { cidade: cidade.trim(), estado } });
  };

  return (
    <Screen title="CONSULTA NOSSO SANGUE" showBack>
      <Text style={{ textAlign: 'center', fontSize: 13, marginTop: 24, marginBottom: 28, maxWidth: 280 }}>
        Pesquise a cidade e escolha o hemocentro para ver os níveis de sangue.{'\n'}
        Sua doação faz a diferença para o nosso futuro!
      </Text>
      <Input placeholder="CIDADE" value={cidade} onChangeText={setCidade} style={{ backgroundColor: '#D9D9D9', borderWidth: 0, width: 220, alignSelf: 'center' }} />
      <Select variant="gray" placeholder="ESTADO" value={estado} options={ESTADOS} onChange={setEstado} />
      {!!erro && <Text style={{ color: '#F2161E', marginBottom: 8 }}>{erro}</Text>}
      <Button label="PESQUISAR" size="sm" pill={false} onPress={buscar} style={{ marginTop: 6 }} />
    </Screen>
  );
}
