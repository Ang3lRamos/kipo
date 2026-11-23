import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';

import { withAutoLockSuspended } from '@/features/lock/auto-lock-guard';
import type { DocumentPage } from '@/types/page';

import { decryptToTemp } from './encrypted-store';
import { discardTemp } from './local-store';

// Compartir una página con el menú del sistema (WhatsApp, correo…). Es la única vez que un
// archivo sale de Kipo sin cifrar, y solo porque el usuario lo pide: se descifra a la caché
// temporal (que se borra al bloquear) y se borra apenas termina el menú de compartir.

export const canShare = () => Sharing.isAvailableAsync();

// Las fotos se guardan en WebP; para compartir se pasan a JPEG, que abre en cualquier lado.
async function toJpeg(webp: File, name: string): Promise<File> {
  const context = ImageManipulator.manipulate(webp.uri);
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  image.release();
  context.release();
  const jpeg = new File(saved.uri);
  // A la carpeta de descifrados, para que también se borre al bloquear.
  const destination = new File(webp.parentDirectory, `${name}.jpg`);
  if (destination.exists) destination.delete();
  jpeg.move(destination);
  return destination;
}

export async function sharePage(
  fileKey: Uint8Array,
  page: DocumentPage,
  title: string,
): Promise<void> {
  const isPdf = page.mimeType === 'application/pdf';
  const decrypted = await decryptToTemp(fileKey, page.filePath, page.id, isPdf ? 'pdf' : 'page');
  let shared = decrypted;
  try {
    if (!isPdf) shared = await toJpeg(decrypted, page.id);
    await withAutoLockSuspended(() =>
      Sharing.shareAsync(shared.uri, {
        mimeType: isPdf ? 'application/pdf' : 'image/jpeg',
        dialogTitle: `Compartir ${title}`,
      }),
    );
  } finally {
    discardTemp(decrypted.uri);
    discardTemp(shared.uri);
  }
}
