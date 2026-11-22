import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useVault } from './vault-context';

export function HomeHeaderButtons() {
  const { lock } = useVault();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Seguridad"
        hitSlop={8}
        onPress={() => router.push('/security')}
      >
        <Text style={styles.icon}>⚙️</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bloquear"
        hitSlop={8}
        onPress={lock}
      >
        <Text style={styles.icon}>🔒</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 20 },
  row: { flexDirection: 'row', gap: 18 },
});
