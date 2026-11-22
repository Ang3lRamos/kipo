import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';

import { getPage, listPages } from '@/db/pages-repo';
import type { DocumentPage } from '@/types/page';
import { useFocusedQuery } from '@/ui/use-focused-query';

export function usePages(documentId: string) {
  const db = useSQLiteContext();
  const load = useCallback(() => listPages(db, documentId), [db, documentId]);
  return useFocusedQuery(load, [] as DocumentPage[]);
}

export function usePage(pageId: string) {
  const db = useSQLiteContext();
  const load = useCallback(() => getPage(db, pageId), [db, pageId]);
  return useFocusedQuery(load, null as DocumentPage | null);
}
