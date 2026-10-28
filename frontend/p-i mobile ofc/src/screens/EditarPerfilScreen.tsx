import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import Screen from '../components/Screen';
import Select from '../components/Select';
import { useAuth } from '../context/AuthContext';
import { GENEROS } from '../data/options';
import { colors } from '../theme';
import { isDate, maskCpf, maskDate, maskPhone, onlyDigits } from '../utils/masks';

export default function EditarPerfilScreen() {
  const { user, updateUser } = useAuth();
  const [f, setF] = useState({
    nome: user?.nome ?? '',
    cpf: user?.cpf ?? '',
    dataNascimento: user?.dataNascimento ?? '',
    telefone: user?.telefone ?? '',
    genero: user?.genero ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const salvar = async () => {
    const e: Record<string, string> = {};
    if (f.nome.trim().split(' ').length < 2) e.nome = 'Informe o nome completo.';
    if (onlyDigits(f.cpf).length !== 11) e.cpf = 'CPF deve ter 11 dígitos.';
    if (!isDate(f.dataNascimento)) e.dataNascimento = 'Use o formato dd/mm/aaaa.';
    if (onlyDigits(f.telefone).length < 10) e.telefone = 'Telefone inválido.';
    if (!f.genero) e.genero = 'Selecione o gênero.';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      setLoading(true);
      await updateUser({ ...f, nome: f.nome.trim() });
      Alert.alert('Pronto', 'Perfil atualizado.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Não foi possível salvar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="EDITAR PERFIL" showBack>
      <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#D9D9D9', borderWidth: 2, borderColor: colors.bright, marginVertical: 20 }} />
      <View style={{ width: '90%' }}>
        <Input variant="dark" placeholder="NOME COMPLETO" value={f.nome} onChangeText={set('nome')} error={errors.nome} style={{ textAlign: 'left' }} />
        <Input variant="dark" placeholder="000.000.000-00 (CPF DO USUÁRIO)" value={f.cpf} onChangeText={(v) => set('cpf')(maskCpf(v))} keyboardType="number-pad" error={errors.cpf} style={{ textAlign: 'left' }} />
        <Input variant="dark" placeholder="00/00/0000 (DATA NASCIMENTO)" value={f.dataNascimento} onChangeText={(v) => set('dataNascimento')(maskDate(v))} keyboardType="number-pad" error={errors.dataNascimento} style={{ textAlign: 'left' }} />
        <Input variant="dark" placeholder="(00) 00000-0000 (TELEFONE)" value={f.telefone} onChangeText={(v) => set('telefone')(maskPhone(v))} keyboardType="phone-pad" error={errors.telefone} style={{ textAlign: 'left' }} />
        <Select variant="dark" placeholder="GÊNERO" value={f.genero} options={GENEROS} onChange={set('genero')} error={errors.genero} />
      </View>
      <Button label="SALVAR ALTERAÇÕES" size="sm" color={colors.black} onPress={salvar} loading={loading} style={{ marginTop: 16 }} />
    </Screen>
  );
}
