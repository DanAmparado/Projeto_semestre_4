import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import Button from '../src/components/Button';
import Input from '../src/components/Input';
import Logo from '../src/components/Logo';
import Screen from '../src/components/Screen';
import { useAuth } from '../src/context/AuthContext';
import { colors } from '../src/theme';
import { isEmail } from '../src/utils/masks';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; senha?: string }>({});

  const submit = async () => {
    const e: typeof errors = {};
    if (!isEmail(email)) e.email = 'Informe um e-mail válido.';
    if (!senha) e.senha = 'Informe a senha.';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      setLoading(true);
      await signIn(email.trim(), senha);
      router.replace('/home');
    } catch (err: any) {
      Alert.alert('Não foi possível entrar', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="LOGIN" showBack>
      <View style={{ marginTop: 40, marginBottom: 40 }}>
        <Logo size={150} />
      </View>
      <View style={{ width: '85%' }}>
        <Input placeholder="SEU EMAIL" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
        <Input placeholder="SENHA" value={senha} onChangeText={setSenha} secureTextEntry error={errors.senha} />
      </View>
      <Button label="CONTINUAR" color={colors.green} onPress={submit} loading={loading} style={{ marginTop: 24 }} />
    </Screen>
  );
}
