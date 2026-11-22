import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { addPages } from '@/db/pages-repo';
import type { CapturedItem } from '@/files/capture';
import { expoImageOps } from '@/files/expo-image-ops';
import { processImage } from '@/files/image-pipeline';
import { deleteLocalFile, discardTemp, moveIntoStore } from '@/files/local-store';
import { pageFilePath, pageThumbPath } from '@/files/storage-paths';
import type { NewPage } from '@/types/page';

async function storeImage(documentId: string, pageId: string, uri: string): Promise<NewPage> {
  const { page, thumb } = await processImage(expoImageOps, uri);
  const filePath = pageFilePath(documentId, pageId, 'webp');
  const thumbPath = pageThumbPath(documentId, pageId);
  try {
    const sizeBytes = await moveIntoStore(page.uri, filePath);
    await moveIntoStore(thumb.uri, thumbPath);
    return {
      id: pageId,
      documentId,
      filePath,
      thumbPath,
      mimeType: 'image/webp',
      sizeBytes,
      width: page.width,
      height: page.height,
    };
  } catch (error) {
    deleteLocalFile(filePath);
    deleteLocalFile(thumbPath);
    discardTemp(page.uri);
    discardTemp(thumb.uri);
    throw error;
  }
}

async function storePdf(documentId: string, pageId: string, uri: string): Promise<NewPage> {
  const filePath = pageFilePath(documentId, pageId, 'pdf');
  const sizeBytes = await moveIntoStore(uri, filePath);
  return {
    id: pageId,
    documentId,
    filePath,
    thumbPath: null,
    mimeType: 'application/pdf',
    sizeBytes,
    width: null,
    height: null,
  };
}

export type ImportResult = { added: number; failed: number };

// capturar → comprimir (WebP) → miniatura → guardar. Cifrar y subir llegan en las fases 3 y 5.
export async function importPages(
  db: SQLiteDatabase,
  documentId: string,
  items: CapturedItem[],
): Promise<ImportResult> {
  const pages: NewPage[] = [];
  let failed = 0;
  for (const item of items) {
    const pageId = randomUUID();
    try {
      pages.push(
        item.kind === 'image'
          ? await storeImage(documentId, pageId, item.uri)
          : await storePdf(documentId, pageId, item.uri),
      );
    } catch (error) {
      failed++;
      console.error('No se pudo importar una página', error);
    } finally {
      discardTemp(item.uri);
    }
  }
  await addPages(db, documentId, pages);
  return { added: pages.length, failed };
}
