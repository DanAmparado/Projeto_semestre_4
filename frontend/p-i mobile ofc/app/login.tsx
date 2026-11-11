import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import Screen from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';
import { isEmail } from '../utils/masks';

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

  const recuperarSenha = async () => {
    if (!isEmail(email)) {
      Alert.alert('Preencha o e-mail primeiro', 'Digite um e-mail válido no campo acima.');
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://nosso-sangue.vercel.app/pages/reset-password.html',
    });

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    Alert.alert(
      'Verifique seu e-mail',
      'Enviamos um link para redefinir sua senha. Abra no navegador para continuar.',
    );
  };

  return (
    <Screen title='LOGIN' showBack>
      <View style={{ marginTop: 40, marginBottom: 40 }}>
        <Logo size={150} />
      </View>
      <View style={{ width: '85%' }}>
        <Input placeholder='SEU EMAIL' value={email} onChangeText={setEmail} autoCapitalize='none' keyboardType='email-address' error={errors.email} />
        <Input placeholder='SENHA' value={senha} onChangeText={setSenha} secureTextEntry error={errors.senha} />
      </View>
      <Button label='CONTINUAR' color={colors.green} onPress={submit} loading={loading} style={{ marginTop: 24 }} />
      <Pressable onPress={recuperarSenha} style={{ marginTop: 18 }}>
        <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Esqueci minha senha</Text>
      </Pressable>
    </Screen>
  );
}