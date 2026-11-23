import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { getSecret, listSecrets } from '@/db/secrets-repo';
import type { SecretKind, SecretRecord } from '@/types/secret';
import { useFocusedQuery } from '@/ui/use-focused-query';

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useSecretList(query: string, kind: SecretKind | null) {
  const db = useSQLiteContext();
  const debounced = useDebounced(query, 150);
  const load = useCallback(
    () => listSecrets(db, { query: debounced, kind }),
    [db, debounced, kind],
  );
  return useFocusedQuery(load, [] as SecretRecord[]);
}

export function useSecret(id: string) {
  const db = useSQLiteContext();
  const load = useCallback(() => getSecret(db, id), [db, id]);
  return useFocusedQuery(load, null as SecretRecord | null);
}
