import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrateLegacyDatabase } from '@/db/migrate-legacy';
import { unlockDatabase, vaultDbName } from '@/db/open-encrypted';
import type { Session } from '@/features/lock/vault-actions';
import { VaultProvider, useVault } from '@/features/lock/vault-context';
import { VaultGate } from '@/features/lock/vault-gate';
import { encryptLegacyFiles } from '@/files/migrate-legacy-files';
import { useTheme } from '@/ui/theme';

import { HomeHeaderButtons } from '@/features/lock/home-header-buttons';

function UnlockedApp({ session }: { session: Session }) {
  const theme = useTheme();
  const { lock } = useVault();
  const { dbKey, fileKey } = session.keys;

  const onInit = useCallback(
    async (db: SQLiteDatabase) => {
      await unlockDatabase(db, dbKey);
      // Datos de las fases 1 y 2 (sin cifrar): se cifran la primera vez.
      await migrateLegacyDatabase(db);
      await encryptLegacyFiles(db, fileKey);
    },
    [dbKey, fileKey],
  );

  const onError = useCallback(
    (error: Error) => {
      console.error('No se pudo abrir la base cifrada', error);
      lock();
    },
    [lock],
  );

  return (
    <SQLiteProvider databaseName={vaultDbName} onInit={onInit} onError={onError}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerBackTitle: 'Atrás',
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Kipo', headerRight: () => <HomeHeaderButtons /> }}
        />
        <Stack.Screen name="expiring" options={{ title: 'Por vencer' }} />
        <Stack.Screen name="security" options={{ title: 'Seguridad' }} />
        <Stack.Screen name="documents/new" options={{ title: 'Nuevo documento' }} />
        <Stack.Screen name="documents/[id]/index" options={{ title: 'Documento' }} />
        <Stack.Screen name="documents/[id]/edit" options={{ title: 'Editar documento' }} />
        <Stack.Screen
          name="documents/[id]/pages/[pageId]"
          options={{
            title: 'Página',
            contentStyle: { backgroundColor: '#000000' },
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#ffffff',
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="auto" />
      <VaultProvider>
        <VaultGate>{(session) => <UnlockedApp session={session} />}</VaultGate>
      </VaultProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
