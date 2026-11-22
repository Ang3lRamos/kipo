import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Kipo } from '@/ui/kipo/kipo';
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
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, gap: 16, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', gap: 12, marginBottom: 8 },
  screen: { flex: 1 },
  subtitle: { opacity: 0.85 },
});
