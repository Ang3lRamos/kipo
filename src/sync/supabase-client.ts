import 'react-native-url-polyfill/auto';

import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';

// La app solo conoce la URL y la anon key de Supabase (públicas por diseño; RLS protege
// los datos). Se leen de .env (EXPO_PUBLIC_*), que nunca entra a git.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isCloudConfigured = url.startsWith('https://') && anonKey.length > 0;

// La sesión de Supabase (tokens) se guarda en el Keystore, no en almacenamiento sin cifrar.
const secureStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!isCloudConfigured) throw new Error('Falta configurar Supabase en .env');
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: secureStorage,
        storageKey: 'kipo.supabase.session',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    });
    // Renovar el token solo con la app en primer plano (recomendado para React Native).
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }
  return client;
}
