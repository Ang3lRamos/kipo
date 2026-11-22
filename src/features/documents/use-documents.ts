import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { listActivity } from '@/db/activity-repo';
import { getDocument, listDocuments, listExpiring, type DocumentFilter } from '@/db/documents-repo';
import type { ActivityEntry, DocumentRecord } from '@/types/document';

import { addDays, todayIso } from './dates';
import { expiringWindowDays } from './expiry-badge';

// Ejecuta `load` cada vez que la pantalla gana el foco, para ver cambios hechos en otras pantallas.
function useFocusedQuery<T>(load: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void version; // cambia para forzar una nueva consulta
      load()
        .then((result) => {
          if (active) setData(result);
        })
        .catch((error: unknown) => console.error('Error al consultar la base local', error))
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [load, version]),
  );

  return { data, loading, reload };
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useDocumentList(filter: DocumentFilter) {
  const db = useSQLiteContext();
  const query = useDebounced(filter.query ?? '', 150);
  const category = filter.category ?? null;
  const load = useCallback(() => listDocuments(db, { query, category }), [db, query, category]);
  return useFocusedQuery(load, [] as DocumentRecord[]);
}

export function useExpiringDocuments() {
  const db = useSQLiteContext();
  const load = useCallback(() => listExpiring(db, addDays(todayIso(), expiringWindowDays)), [db]);
  return useFocusedQuery(load, [] as DocumentRecord[]);
}

export type DocumentDetail = { doc: DocumentRecord | null; activity: ActivityEntry[] };

export function useDocumentDetail(id: string) {
  const db = useSQLiteContext();
  const load = useCallback(async (): Promise<DocumentDetail> => {
    const [doc, activity] = await Promise.all([getDocument(db, id), listActivity(db, id)]);
    return { doc, activity };
  }, [db, id]);
  return useFocusedQuery(load, { doc: null, activity: [] } as DocumentDetail);
}
