import { StyleSheet, Text, View } from 'react-native';

import { appName } from '@/types/app';

// Pantalla temporal de la fase 0: solo confirma que la app arranca.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{appName}</Text>
      <Text style={styles.subtitle}>Tus documentos, seguros y a mano.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  subtitle: { color: '#6b7280', fontSize: 16, marginTop: 8 },
  title: { fontSize: 32, fontWeight: '700' },
});
