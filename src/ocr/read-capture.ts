import type { CapturedItem } from '@/files/capture';
import { discardTemp } from '@/files/local-store';

import { recognizeImage, renderPdfPages } from './recognize';

export type CaptureReading = {
  text: string;
  // Solo PDFs: primera página como imagen (temporal) para hacer la miniatura.
  firstPageImage: string | null;
};

// Lee el texto de una captura (imagen o PDF). Los JPEG temporales del PDF se borran aquí,
// salvo la primera página si se pide para la miniatura (`keepFirstPage`).
export async function readCapture(
  item: CapturedItem,
  { keepFirstPage = false }: { keepFirstPage?: boolean } = {},
): Promise<CaptureReading> {
  if (item.kind === 'image') return { text: await recognizeImage(item.uri), firstPageImage: null };

  const pages = await renderPdfPages(item.uri);
  const texts: string[] = [];
  for (const [index, page] of pages.entries()) {
    texts.push(await recognizeImage(page));
    if (!(keepFirstPage && index === 0)) discardTemp(page);
  }
  return {
    text: texts.filter(Boolean).join('\n'),
    firstPageImage: keepFirstPage ? (pages[0] ?? null) : null,
  };
}
