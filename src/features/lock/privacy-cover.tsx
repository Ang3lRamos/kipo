import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { Kipo } from '@/ui/kipo/kipo';
import { useTheme } from '@/ui/theme-provider';

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
    <View
      style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: theme.colors.location.bg }]}
    >
      <Kipo mood="dormido" size={140} animated={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { alignItems: 'center', justifyContent: 'center' },
});
