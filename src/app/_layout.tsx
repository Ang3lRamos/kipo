import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDb } from '@/db/migrate';
import { useTheme } from '@/ui/theme';

export default function RootLayout() {
  const theme = useTheme();
  return (
    <SQLiteProvider databaseName="kipo.db" onInit={migrateDb}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: theme.background },
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
          headerBackTitle: 'Atrás',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Kipo' }} />
        <Stack.Screen name="expiring" options={{ title: 'Por vencer' }} />
        <Stack.Screen name="documents/new" options={{ title: 'Nuevo documento' }} />
        <Stack.Screen name="documents/[id]/index" options={{ title: 'Documento' }} />
        <Stack.Screen name="documents/[id]/edit" options={{ title: 'Editar documento' }} />
      </Stack>
    </SQLiteProvider>
  );
}
