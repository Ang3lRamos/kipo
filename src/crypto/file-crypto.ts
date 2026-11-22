import { open, seal } from './aead';
import type { CryptoPrimitives } from './primitives';

// Cada archivo se cifra con la llave de archivos (derivada de la DEK) y un nonce nuevo.
// La AAD liga el contenido a su página y a su tipo: no se puede intercambiar la miniatura
// de un documento por la página de otro sin que el descifrado falle.

export type FileKind = 'page' | 'thumb' | 'pdf';

export function fileAad(pageId: string, kind: FileKind): string {
  return `kipo/file/v1/${kind}/${pageId}`;
}

export function encryptFile(
  crypto: CryptoPrimitives,
  fileKey: Uint8Array,
  bytes: Uint8Array,
  aad: string,
): Uint8Array {
  return seal(crypto, fileKey, bytes, aad);
}

export function decryptFile(
  crypto: CryptoPrimitives,
  fileKey: Uint8Array,
  sealed: Uint8Array,
  aad: string,
): Uint8Array {
  return open(crypto, fileKey, sealed, aad);
}
