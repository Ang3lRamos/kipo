import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

import { assertLength, utf8 } from './bytes';

// De la DEK se derivan llaves separadas por uso con HKDF-SHA256 (separación de dominios):
// si una se expone en un contexto, no compromete las otras.

export function hkdfSha256(ikm: Uint8Array, info: string, length = 32): Uint8Array {
  return hkdf(sha256, ikm, undefined, utf8(info), length);
}

// metaKey cifra los metadatos que viajan a la nube (fase 5).
export type Subkeys = { dbKey: Uint8Array; fileKey: Uint8Array; metaKey: Uint8Array };

export function deriveSubkeys(dek: Uint8Array): Subkeys {
  assertLength(dek, 32, 'La DEK');
  return {
    dbKey: hkdfSha256(dek, 'kipo/sqlcipher/v1'),
    fileKey: hkdfSha256(dek, 'kipo/files/v1'),
    metaKey: hkdfSha256(dek, 'kipo/metadata/v1'),
  };
}
