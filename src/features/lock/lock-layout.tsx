import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/ui/theme';

type Props = { title: string; subtitle?: string; children: ReactNode };

// Marco común de las pantallas de bloqueo, configuración inicial y recuperación.
export function LockLayout({ title, subtitle, children }: Props) {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.logo}>🔐</Text>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: theme.muted }]}>{subtitle}</Text>
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
  header: { alignItems: 'center', gap: 8, marginBottom: 8 },
  logo: { fontSize: 44 },
  screen: { flex: 1 },
  subtitle: { fontSize: 15, lineHeight: 21, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
});
