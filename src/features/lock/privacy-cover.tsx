import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/ui/theme';

// Tapa el contenido cuando la app no está activa, para que no se vea en el selector de apps.
// En Android además actúa FLAG_SECURE (expo-screen-capture).
export function PrivacyCover() {
  const theme = useTheme();
  const [visible, setVisible] = useState(AppState.currentState !== 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) =>
      setVisible(next !== 'active'),
    );
    return () => subscription.remove();
  }, []);

  if (!visible) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: theme.background }]}>
      <Text style={styles.icon}>🔐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 48 },
});
