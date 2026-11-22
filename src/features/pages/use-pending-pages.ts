import { useCallback, useEffect, useRef, useState } from 'react';

import type { CapturedItem } from '@/files/capture';
import { discardTemp } from '@/files/local-store';

// Páginas capturadas antes de guardar el documento. Son temporales sin cifrar en la caché:
// si el usuario sale sin guardar, se borran.
export function usePendingPages() {
  const [items, setItems] = useState<CapturedItem[]>([]);
  const itemsRef = useRef(items);
  const committed = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      if (!committed.current) itemsRef.current.forEach((item) => discardTemp(item.uri));
    },
    [],
  );

  const add = useCallback((more: CapturedItem[]) => setItems((prev) => [...prev, ...more]), []);

  const remove = useCallback((index: number) => {
    setItems((prev) => {
      const item = prev[index];
      if (item) discardTemp(item.uri);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Al guardar, importPages se encarga de borrar los temporales.
  const commit = useCallback(() => {
    committed.current = true;
    return itemsRef.current;
  }, []);

  return { items, add, remove, commit };
}
