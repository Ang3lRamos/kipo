import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { addPages } from '@/db/pages-repo';
import type { CapturedItem } from '@/files/capture';
import { storeEncrypted } from '@/files/encrypted-store';
import { expoImageOps } from '@/files/expo-image-ops';
import { processImage } from '@/files/image-pipeline';
import { deleteLocalFile, discardTemp } from '@/files/local-store';
import { pageFilePath, pageThumbPath } from '@/files/storage-paths';
import type { NewPage } from '@/types/page';

async function storeImage(
  fileKey: Uint8Array,
  documentId: string,
  pageId: string,
  uri: string,
): Promise<NewPage> {
  const { page, thumb } = await processImage(expoImageOps, uri);
  const filePath = pageFilePath(documentId, pageId);
  const thumbPath = pageThumbPath(documentId, pageId);
  try {
    const sizeBytes = await storeEncrypted(fileKey, page.uri, filePath, pageId, 'page');
    await storeEncrypted(fileKey, thumb.uri, thumbPath, pageId, 'thumb');
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

async function storePdf(
  fileKey: Uint8Array,
  documentId: string,
  pageId: string,
  uri: string,
): Promise<NewPage> {
  const filePath = pageFilePath(documentId, pageId);
  const sizeBytes = await storeEncrypted(fileKey, uri, filePath, pageId, 'pdf');
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

// capturar → comprimir (WebP) → miniatura → cifrar → guardar. Subir llega en la fase 5.
export async function importPages(
  db: SQLiteDatabase,
  fileKey: Uint8Array,
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
          ? await storeImage(fileKey, documentId, pageId, item.uri)
          : await storePdf(fileKey, documentId, pageId, item.uri),
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
