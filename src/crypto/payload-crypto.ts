import { open, seal } from './aead';
import { fromBase64, toBase64, utf8 } from './bytes';
import type { CryptoPrimitives } from './primitives';

// Metadatos de un documento para la nube: JSON → AES-256-GCM con la llave de metadatos.
// La AAD liga el contenido a su documento: no se puede pegar el contenido de un documento
// en la fila de otro.

export function payloadAad(documentId: string): string {
  return `kipo/doc/v1/${documentId}`;
}

export function encryptPayload(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  documentId: string,
  value: unknown,
): string {
  return toBase64(seal(crypto, metaKey, utf8(JSON.stringify(value)), payloadAad(documentId)));
}

export function decryptPayload(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  documentId: string,
  encoded: string,
): unknown {
  const plain = open(crypto, metaKey, fromBase64(encoded), payloadAad(documentId));
  return JSON.parse(new TextDecoder().decode(plain));
}
