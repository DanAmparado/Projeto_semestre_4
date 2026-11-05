import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Welcome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nosso Sangue</Text>
      <Text style={styles.subtitle}>Doe sangue. Salve vidas.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => router.push('/signup')}
      >
        <Text style={[styles.buttonText, styles.secondaryText]}>Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B01F2E',
    padding: 24,
  },
  title: { fontSize: 40, color: '#fff', fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#fff', marginBottom: 48 },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginBottom: 12,
    width: '80%',
    alignItems: 'center',
  },
  secondary: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#fff' },
  buttonText: { color: '#B01F2E', fontSize: 16, fontWeight: 'bold' },
  secondaryText: { color: '#fff' },
});