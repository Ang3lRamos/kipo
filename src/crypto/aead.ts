import { assertLength, concatBytes, utf8 } from './bytes';
import { DecryptionError } from './errors';
import { gcmTagLength, type CryptoPrimitives } from './primitives';

// Formato de todo lo que Kipo cifra:  [versión 1 byte][nonce 12 bytes][cifrado][etiqueta 16]
// - El nonce es aleatorio por cada cifrado. Con 96 bits y el volumen de un usuario,
//   la probabilidad de repetir uno es despreciable (el límite seguro es ~2^32 cifrados por llave).
// - La AAD (contexto) no se cifra pero sí se autentica: liga el dato a su uso
//   ("es la miniatura de la página X"), así no se puede cambiar un archivo por otro.

const formatVersion = 1;
const nonceLength = 12;
const keyLength = 32;

export function seal(
  crypto: CryptoPrimitives,
  key: Uint8Array,
  plaintext: Uint8Array,
  aad: string,
): Uint8Array {
  assertLength(key, keyLength, 'La llave');
  const nonce = crypto.randomBytes(nonceLength);
  const body = crypto.aesGcmEncrypt(key, nonce, plaintext, utf8(aad));
  return concatBytes(Uint8Array.of(formatVersion), nonce, body);
}

export function open(
  crypto: CryptoPrimitives,
  key: Uint8Array,
  sealed: Uint8Array,
  aad: string,
): Uint8Array {
  assertLength(key, keyLength, 'La llave');
  if (sealed.length < 1 + nonceLength + gcmTagLength || sealed[0] !== formatVersion) {
    throw new DecryptionError();
  }
  const nonce = sealed.subarray(1, 1 + nonceLength);
  try {
    return crypto.aesGcmDecrypt(key, nonce, sealed.subarray(1 + nonceLength), utf8(aad));
  } catch {
    throw new DecryptionError();
  }
}
