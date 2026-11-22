import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { IconButton } from './icon-button';
import { AppText } from './text';
import { useTheme } from './theme-provider';

type ScreenProps = { children: ReactNode; edges?: Edge[]; background?: string };

// Contenedor de pantalla con el fondo del tema y las zonas seguras del teléfono.
export function Screen({ children, edges = ['top'], background }: ScreenProps) {
  const theme = useTheme();
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.screen, { backgroundColor: background ?? theme.colors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

type HeaderProps = { title?: string; right?: ReactNode; onBack?: () => void };

// Barra superior propia: volver, título y acciones a la derecha.
export function ScreenHeader({ title, right, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <IconButton
        icon={ChevronLeft}
        accessibilityLabel="Volver"
        tone="surface"
        onPress={onBack ?? (() => router.back())}
      />
      <AppText variant="h3" numberOfLines={1} style={styles.title}>
        {title ?? ''}
      </AppText>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

export function Logo() {
  return (
    <AppText variant="h2" color="accentText">
      kipo
    </AppText>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    minWidth: 44,
    justifyContent: 'flex-end',
  },
  screen: { flex: 1 },
  title: { flex: 1 },
});
