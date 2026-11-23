import { Directory, File, Paths } from 'expo-file-system';

import { toBase64, wipe } from '@/crypto/bytes';
import { decryptFile, encryptFile, fileAad, type FileKind } from '@/crypto/file-crypto';
import { nativePrimitives } from '@/crypto/native-primitives';

import { discardTemp, localFile } from './local-store';

// Puente entre archivos y cifrado. Reglas:
// - En disco permanente solo se escribe contenido cifrado.
// - Las imágenes descifradas viven solo en memoria (data URI).
// - Los PDF descifrados van a una carpeta temporal que se borra al bloquear.

const decryptedDir = () => new Directory(Paths.cache, 'decrypted');

// Lee un temporal en claro, lo cifra, lo guarda en `relativePath` y borra el temporal.
export async function storeEncrypted(
  fileKey: Uint8Array,
  tempUri: string,
  relativePath: string,
  pageId: string,
  kind: FileKind,
): Promise<number> {
  const plain = await new File(tempUri).bytes();
  try {
    const sealed = encryptFile(nativePrimitives, fileKey, plain, fileAad(pageId, kind));
    const destination = localFile(relativePath);
    destination.parentDirectory.create({ intermediates: true, idempotent: true });
    destination.write(sealed);
    return sealed.length;
  } finally {
    wipe(plain);
    discardTemp(tempUri);
  }
}

export async function readDecrypted(
  fileKey: Uint8Array,
  relativePath: string,
  pageId: string,
  kind: FileKind,
): Promise<Uint8Array> {
  const sealed = await localFile(relativePath).bytes();
  return decryptFile(nativePrimitives, fileKey, sealed, fileAad(pageId, kind));
}

export async function decryptToDataUri(
  fileKey: Uint8Array,
  relativePath: string,
  pageId: string,
  kind: 'page' | 'thumb',
): Promise<string> {
  const bytes = await readDecrypted(fileKey, relativePath, pageId, kind);
  try {
    return `data:image/webp;base64,${toBase64(bytes)}`;
  } finally {
    wipe(bytes);
  }
}

// El visor de PDF del sistema y el OCR necesitan un archivo: se descifra a la caché temporal,
// que se borra al bloquear. Quien lo pide para el OCR debe borrarlo apenas termine.
export async function decryptToTemp(
  fileKey: Uint8Array,
  relativePath: string,
  pageId: string,
  kind: 'page' | 'pdf',
): Promise<File> {
  const bytes = await readDecrypted(fileKey, relativePath, pageId, kind);
  try {
    const dir = decryptedDir();
    dir.create({ intermediates: true, idempotent: true });
    const file = new File(dir, `${pageId}.${kind === 'pdf' ? 'pdf' : 'webp'}`);
    file.write(bytes);
    // Referencia nueva: la anterior se creó cuando el archivo no existía y el visor la
    // rechazaba la primera vez ("File does not exist").
    return new File(file.uri);
  } finally {
    wipe(bytes);
  }
}

export const decryptPdfToTemp = (fileKey: Uint8Array, relativePath: string, pageId: string) =>
  decryptToTemp(fileKey, relativePath, pageId, 'pdf');

export function wipeDecryptedCache(): void {
  try {
    const dir = decryptedDir();
    if (dir.exists) dir.delete();
  } catch (error) {
    console.warn('No se pudo limpiar la caché descifrada', error);
  }
}
