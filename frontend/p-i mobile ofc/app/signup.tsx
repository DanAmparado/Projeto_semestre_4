import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [loading, setLoading] = useState(false);

  async function cadastrar() {
    if (!email || !senha || !nome || !cpf || !nascimento) {
      Alert.alert('Atenção', 'Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome_completo: nome, cpf, data_nascimento: nascimento },
      },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Erro ao cadastrar', error.message);
      return;
    }
    Alert.alert(
      'Conta criada',
      'Verifique seu email para confirmar a conta antes de entrar.',
      [{ text: 'OK', onPress: () => router.replace('/login') }]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar conta</Text>

      <Text style={styles.label}>Nome completo</Text>
      <TextInput style={styles.input} value={nome} onChangeText={setNome} />

      <Text style={styles.label}>CPF (só números)</Text>
      <TextInput
        style={styles.input}
        value={cpf}
        onChangeText={setCpf}
        keyboardType="numeric"
        maxLength={11}
      />

      <Text style={styles.label}>Data de nascimento (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={nascimento}
        onChangeText={setNascimento}
        placeholder="1995-01-01"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Senha</Text>
      <TextInput
        style={styles.input}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Criar conta</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.link}>Já tenho conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#B01F2E' },
  label: { fontSize: 14, color: '#333', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
  button: {
    backgroundColor: '#B01F2E', padding: 14, borderRadius: 8,
    marginTop: 24, alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { color: '#B01F2E', textAlign: 'center', marginTop: 16, fontSize: 14 },
});