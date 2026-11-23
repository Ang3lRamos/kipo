import { useCallback, useEffect, useRef, useState } from 'react';

import type { CapturedItem } from '@/files/capture';
import { discardTemp } from '@/files/local-store';
import { readCapture } from '@/ocr/read-capture';

// Páginas capturadas antes de guardar el documento. Son temporales sin cifrar en la caché:
// si el usuario sale sin guardar, se borran. Apenas llegan, se lee su texto (OCR) para
// sugerir título, categoría y fechas; ese texto se reutiliza al guardar.
export function usePendingPages() {
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [reading, setReading] = useState(0); // cuántas páginas se están leyendo
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

  const add = useCallback((more: CapturedItem[]) => {
    setItems((prev) => [...prev, ...more]);
    setReading((n) => n + more.length);
    void (async () => {
      for (const item of more) {
        try {
          const { text } = await readCapture(item);
          setItems((prev) =>
            prev.map((current) =>
              current.uri === item.uri ? { ...current, ocrText: text } : current,
            ),
          );
        } finally {
          setReading((n) => Math.max(0, n - 1));
        }
      }
    })();
  }, []);

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

  const text = items
    .map((item) => item.ocrText ?? '')
    .filter(Boolean)
    .join('\n');

  return { items, add, remove, commit, reading: reading > 0, text };
}
