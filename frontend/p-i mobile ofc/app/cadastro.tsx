import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Logo from '../src/components/Logo';
import Screen from '../src/components/Screen';
import Select from '../src/components/Select';
import { useAuth } from '../src/context/AuthContext';
import { GENEROS } from '../src/data/options';
import { colors } from '../src/theme';
import { isDate, isEmail, maskCpf, maskDate, maskPhone, onlyDigits } from '../src/utils/masks';

const empty = { nome: '', email: '', email2: '', dataNascimento: '', cpf: '', telefone: '', genero: '', senha: '', senha2: '' };

export default function Cadastro() {
  const { signUp } = useAuth();
  const [f, setF] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof empty) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.nome.trim().split(' ').length < 2) e.nome = 'Informe o nome completo.';
    if (!isEmail(f.email)) e.email = 'E-mail inválido.';
    if (f.email.trim().toLowerCase() !== f.email2.trim().toLowerCase()) e.email2 = 'Os e-mails não conferem.';
    if (!isDate(f.dataNascimento)) e.dataNascimento = 'Use o formato dd/mm/aaaa.';
    if (onlyDigits(f.cpf).length !== 11) e.cpf = 'CPF deve ter 11 dígitos.';
    if (onlyDigits(f.telefone).length < 10) e.telefone = 'Telefone inválido.';
    if (!f.genero) e.genero = 'Selecione o gênero.';
    if (f.senha.length < 6) e.senha = 'Mínimo de 6 caracteres.';
    if (f.senha !== f.senha2) e.senha2 = 'As senhas não conferem.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      await signUp({
        nome: f.nome.trim(),
        email: f.email.trim(),
        dataNascimento: f.dataNascimento,
        cpf: f.cpf,
        telefone: f.telefone,
        genero: f.genero,
        senha: f.senha,
      });
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Não foi possível criar a conta', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="CRIAÇÃO DE CONTA" showBack>
      <View style={{ marginBottom: 16 }}>
        <Logo size={90} />
      </View>
      <View style={{ width: '88%' }}>
        <Input placeholder="SEU NOME COMPLETO" value={f.nome} onChangeText={set('nome')} error={errors.nome} />
        <Input placeholder="SEU EMAIL" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <Input placeholder="CONFIRMAÇÃO DO EMAIL" value={f.email2} onChangeText={set('email2')} autoCapitalize="none" keyboardType="email-address" error={errors.email2} />
        <Input placeholder="DATA DE NASCIMENTO" value={f.dataNascimento} onChangeText={(v) => set('dataNascimento')(maskDate(v))} keyboardType="number-pad" error={errors.dataNascimento} />
        <Input placeholder="CPF" value={f.cpf} onChangeText={(v) => set('cpf')(maskCpf(v))} keyboardType="number-pad" error={errors.cpf} />
        <Input placeholder="TELEFONE" value={f.telefone} onChangeText={(v) => set('telefone')(maskPhone(v))} keyboardType="phone-pad" error={errors.telefone} />
        <Select placeholder="GÊNERO" value={f.genero} options={GENEROS} onChange={set('genero')} error={errors.genero} />
        <Input placeholder="SENHA" value={f.senha} onChangeText={set('senha')} secureTextEntry error={errors.senha} />
        <Input placeholder="CONFIRMAÇÃO DE SENHA" value={f.senha2} onChangeText={set('senha2')} secureTextEntry error={errors.senha2} />
      </View>
      <Button label="CRIAR CONTA" color={colors.green} onPress={submit} loading={loading} style={{ marginTop: 14 }} />
    </Screen>
  );
}
