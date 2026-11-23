import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { vaultDbName } from '@/db/open-encrypted';
import { initVaultDatabase, vaultDbOptions } from '@/features/lock/init-vault-db';
import { LockPreferencesProvider } from '@/features/lock/lock-preferences';
import type { Session } from '@/features/lock/vault-actions';
import { VaultProvider, useVault } from '@/features/lock/vault-context';
import { VaultGate } from '@/features/lock/vault-gate';
import { NotificationRouter } from '@/features/navigation/notification-router';
import { configureNotifications } from '@/notifications/notifier';
import { useAppFonts } from '@/ui/fonts';
import { ThemeProvider, useTheme } from '@/ui/theme-provider';

// El splash sigue visible hasta tener fuentes, tema y estado de la bóveda.
void SplashScreen.preventAutoHideAsync();

function UnlockedApp({ session }: { session: Session }) {
  const theme = useTheme();
  const { lock } = useVault();
  // Ref: cambiar la contraseña crea una sesión nueva con las mismas llaves; la base no debe
  // cerrarse y reabrirse por eso.
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);
  const { keys } = session;
  const onInit = useCallback(
    (db: SQLiteDatabase) => initVaultDatabase(db, { ...sessionRef.current, keys }),
    [keys],
  );

  // SQLiteProvider llama a onError durante el render: se bloquea después, fuera del render.
  const onError = useCallback(
    (error: Error) => {
      console.error('No se pudo abrir la base cifrada', error);
      setTimeout(() => lock('No se pudo abrir la base de datos. Vuelve a desbloquear.'), 0);
    },
    [lock],
  );

  return (
    <SQLiteProvider
      databaseName={vaultDbName}
      options={vaultDbOptions}
      onInit={onInit}
      onError={onError}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="documents/[id]/pages/[pageId]"
          options={{ contentStyle: { backgroundColor: theme.viewer.background } }}
        />
      </Stack>
      <NotificationRouter />
    </SQLiteProvider>
  );
}

function AppShell() {
  const theme = useTheme();
  const { state } = useVault();
  const fontsReady = useAppFonts();
  const ready = fontsReady && state.status !== 'loading';

  useEffect(() => {
    configureNotifications().catch((e: unknown) => console.warn('Sin canal de avisos', e));
  }, []);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!fontsReady) return null;
  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <VaultGate>{(session) => <UnlockedApp session={session} />}</VaultGate>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <LockPreferencesProvider>
          <VaultProvider>
            <AppShell />
          </VaultProvider>
        </LockPreferencesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
