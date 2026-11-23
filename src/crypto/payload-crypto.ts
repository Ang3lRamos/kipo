import { open, seal } from './aead';
import { fromBase64, toBase64, utf8 } from './bytes';
import type { CryptoPrimitives } from './primitives';

// Contenido para la nube: JSON → AES-256-GCM con la llave de metadatos.
// La AAD liga el contenido a su fila y a su tipo: no se puede pegar el contenido de un
// documento en la fila de otro, ni una clave en la fila de un documento.

export type PayloadKind = 'doc' | 'secret';

export function payloadAad(id: string, kind: PayloadKind = 'doc'): string {
  return `kipo/${kind}/v1/${id}`;
}

export function encryptPayload(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  id: string,
  value: unknown,
  kind: PayloadKind = 'doc',
): string {
  return toBase64(seal(crypto, metaKey, utf8(JSON.stringify(value)), payloadAad(id, kind)));
}

export function decryptPayload(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  id: string,
  encoded: string,
  kind: PayloadKind = 'doc',
): unknown {
  const plain = open(crypto, metaKey, fromBase64(encoded), payloadAad(id, kind));
  return JSON.parse(new TextDecoder().decode(plain));
}
