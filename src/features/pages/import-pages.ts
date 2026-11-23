import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { addPages } from '@/db/pages-repo';
import type { CapturedItem } from '@/files/capture';
import { storeEncrypted } from '@/files/encrypted-store';
import { expoImageOps } from '@/files/expo-image-ops';
import { processImage } from '@/files/image-pipeline';
import { deleteLocalFile, discardTemp } from '@/files/local-store';
import { pageFilePath, pageThumbPath } from '@/files/storage-paths';
import { readCapture } from '@/ocr/read-capture';
import { recognizeImage } from '@/ocr/recognize';
import type { NewPage } from '@/types/page';

// capturar → comprimir (WebP) → miniatura → OCR → cifrar → guardar (y luego subir, fase 5).
// El OCR lee la imagen ya comprimida y sin metadatos, antes de cifrarla.

async function storeImage(
  fileKey: Uint8Array,
  documentId: string,
  pageId: string,
  item: CapturedItem,
): Promise<NewPage> {
  const { page, thumb } = await processImage(expoImageOps, item.uri);
  const filePath = pageFilePath(documentId, pageId);
  const thumbPath = pageThumbPath(documentId, pageId);
  try {
    const ocrText = item.ocrText ?? (await recognizeImage(page.uri));
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
      ocrText,
    };
  } catch (error) {
    deleteLocalFile(filePath);
    deleteLocalFile(thumbPath);
    discardTemp(page.uri);
    discardTemp(thumb.uri);
    throw error;
  }
}

// Miniatura de un PDF a partir de su primera página. Si falla, el PDF se guarda sin miniatura.
export async function storePdfThumb(
  fileKey: Uint8Array,
  firstPage: string | null,
  thumbPath: string,
  pageId: string,
): Promise<boolean> {
  if (!firstPage) return false;
  try {
    const { page, thumb } = await processImage(expoImageOps, firstPage);
    discardTemp(page.uri);
    await storeEncrypted(fileKey, thumb.uri, thumbPath, pageId, 'thumb');
    return true;
  } catch (error) {
    console.warn('No se pudo hacer la miniatura del PDF', error);
    return false;
  } finally {
    discardTemp(firstPage);
  }
}

async function storePdf(
  fileKey: Uint8Array,
  documentId: string,
  pageId: string,
  item: CapturedItem,
): Promise<NewPage> {
  const reading = await readCapture(item, { keepFirstPage: true });
  const thumbPath = pageThumbPath(documentId, pageId);
  const hasThumb = await storePdfThumb(fileKey, reading.firstPageImage, thumbPath, pageId);
  const filePath = pageFilePath(documentId, pageId);
  const sizeBytes = await storeEncrypted(fileKey, item.uri, filePath, pageId, 'pdf');
  return {
    id: pageId,
    documentId,
    filePath,
    thumbPath: hasThumb ? thumbPath : null,
    mimeType: 'application/pdf',
    sizeBytes,
    width: null,
    height: null,
    ocrText: item.ocrText ?? reading.text,
  };
}

export type ImportResult = { added: number; failed: number };

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
          ? await storeImage(fileKey, documentId, pageId, item)
          : await storePdf(fileKey, documentId, pageId, item),
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
