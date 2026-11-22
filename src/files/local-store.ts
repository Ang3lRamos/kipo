import { Directory, File, Paths } from 'expo-file-system';

import { documentDir } from './storage-paths';

// Archivos permanentes de la app. En la fase 3 aquí solo habrá datos cifrados.

export function localFile(relativePath: string): File {
  return new File(Paths.document, relativePath);
}

// Mueve un archivo temporal a su ruta definitiva y devuelve su tamaño en bytes.
export async function moveIntoStore(tempUri: string, relativePath: string): Promise<number> {
  const destination = localFile(relativePath);
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  await new File(tempUri).move(destination, { overwrite: true });
  return destination.size;
}

export function deleteLocalFile(relativePath: string | null): void {
  if (!relativePath) return;
  const file = localFile(relativePath);
  if (file.exists) file.delete();
}

export function deleteDocumentFiles(documentId: string): void {
  const dir = new Directory(Paths.document, documentDir(documentId));
  if (dir.exists) dir.delete();
}

// Borra un temporal sin fallar si ya no existe (el escáner y los pickers dejan copias en caché).
// Solo toca archivos dentro de la caché de la app, nunca la galería ni otras carpetas.
export function discardTemp(uri: string): void {
  if (!uri.startsWith(Paths.cache.uri)) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('No se pudo borrar un archivo temporal', error);
  }
}
