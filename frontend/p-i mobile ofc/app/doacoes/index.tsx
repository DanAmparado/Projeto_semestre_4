export { default } from '../../screens/DoacoesScreen';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../src/theme';

const { signedIn, loading } = useAuth();

if (done && !loading) return <Redirect href={signedIn ? '/home' : '/welcome'} />;

return (
  <View style={styles.root}>
    <Logo size={240} />
    {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
  </View>
);
