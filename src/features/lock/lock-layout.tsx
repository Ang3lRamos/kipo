import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Kipo } from '@/ui/kipo/kipo';
import { KeyboardScroll } from '@/ui/keyboard-scroll';
import type { KipoMood } from '@/ui/kipo/kipo-types';
import { Logo } from '@/ui/screen';
import { AppText } from '@/ui/text';
import { useTheme } from '@/ui/theme-provider';

type Props = {
  title: string;
  subtitle?: string;
  mood?: KipoMood;
  kipoSize?: number;
  bounceKey?: number;
  children: ReactNode;
};

// Marco de las pantallas de bloqueo, configuración inicial y recuperación (fondo lavanda).
export function LockLayout({
  title,
  subtitle,
  mood = 'feliz',
  kipoSize = 140,
  bounceKey,
  children,
}: Props) {
  const theme = useTheme();
  const { location } = theme.colors;
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: location.bg }]}>
      <KeyboardScroll contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Logo />
          <Kipo mood={mood} size={kipoSize} bounceKey={bounceKey ?? 0} />
          <AppText variant="h1" color={location.text} align="center">
            {title}
          </AppText>
          {subtitle ? (
            <AppText color={location.text} align="center" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {children}
      </KeyboardScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 16, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', gap: 12, marginBottom: 8 },
  screen: { flex: 1 },
  subtitle: { opacity: 0.85 },
});
