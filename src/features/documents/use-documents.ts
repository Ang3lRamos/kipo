import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { listActivity } from '@/db/activity-repo';
import { getDocument, listDocuments, listExpiring, type DocumentFilter } from '@/db/documents-repo';
import type { ActivityEntry, DocumentRecord } from '@/types/document';
import { useFocusedQuery } from '@/ui/use-focused-query';

import { addDays, todayIso } from './dates';
import { expiringWindowDays } from './expiry-badge';

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
