// Primitivas criptográficas mínimas que usa Kipo, todas de librerías auditadas:
// - Aleatorios: CSPRNG del sistema (OpenSSL vía react-native-quick-crypto).
// - Argon2id para derivar la KEK de la contraseña maestra.
// - AES-256-GCM para cifrar (confidencialidad + integridad).
// Se construyen sobre cualquier módulo con la API de Node: quick-crypto en el teléfono
// y node:crypto en las pruebas, así ambos ejecutan el mismo código.

type BinaryOut = Uint8Array;

type CipherLike = {
  setAAD(aad: Uint8Array): unknown;
  update(data: Uint8Array): BinaryOut;
  final(): BinaryOut;
  getAuthTag(): BinaryOut;
};

type DecipherLike = {
  setAAD(aad: Uint8Array): unknown;
  setAuthTag(tag: Uint8Array): unknown;
  update(data: Uint8Array): BinaryOut;
  final(): BinaryOut;
};

type Argon2Params = {
  message: Uint8Array;
  nonce: Uint8Array;
  parallelism: number;
  tagLength: number;
  memory: number; // KiB
  passes: number;
};

export type NodeLikeCrypto = {
  randomBytes(size: number): BinaryOut;
  argon2(
    algorithm: 'argon2id',
    params: Argon2Params,
    callback: (error: Error | null, result: BinaryOut) => void,
  ): void;
  createCipheriv(
    algorithm: 'aes-256-gcm',
    key: Uint8Array,
    iv: Uint8Array,
    options: { authTagLength: number },
  ): CipherLike;
  createDecipheriv(
    algorithm: 'aes-256-gcm',
    key: Uint8Array,
    iv: Uint8Array,
    options: { authTagLength: number },
  ): DecipherLike;
};

export type Argon2Cost = { memoryKiB: number; passes: number; parallelism: number };

export type CryptoPrimitives = {
  randomBytes(size: number): Uint8Array;
  argon2id(
    password: Uint8Array,
    salt: Uint8Array,
    cost: Argon2Cost,
    length: number,
  ): Promise<Uint8Array>;
  aesGcmEncrypt(
    key: Uint8Array,
    nonce: Uint8Array,
    plaintext: Uint8Array,
    aad: Uint8Array,
  ): Uint8Array;
  // Lanza si la etiqueta no coincide (llave, AAD o datos incorrectos).
  aesGcmDecrypt(
    key: Uint8Array,
    nonce: Uint8Array,
    sealed: Uint8Array,
    aad: Uint8Array,
  ): Uint8Array;
};

export const gcmTagLength = 16;

// Copia a un Uint8Array simple y borra el Buffer de origen.
function plain(buffer: BinaryOut): Uint8Array {
  const copy = new Uint8Array(buffer.length);
  copy.set(buffer);
  buffer.fill(0);
  return copy;
}

function joinOutput(...parts: BinaryOut[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
    part.fill(0);
  }
  return out;
}

export function createPrimitives(crypto: NodeLikeCrypto): CryptoPrimitives {
  return {
    randomBytes: (size) => plain(crypto.randomBytes(size)),

    argon2id: (password, salt, cost, length) =>
      new Promise((resolve, reject) => {
        crypto.argon2(
          'argon2id',
          {
            message: password,
            nonce: salt,
            parallelism: cost.parallelism,
            tagLength: length,
            memory: cost.memoryKiB,
            passes: cost.passes,
          },
          (error, result) => (error ? reject(error) : resolve(plain(result))),
        );
      }),

    // Devuelve texto cifrado || etiqueta (16 bytes).
    aesGcmEncrypt: (key, nonce, plaintext, aad) => {
      const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce, {
        authTagLength: gcmTagLength,
      });
      cipher.setAAD(aad);
      return joinOutput(cipher.update(plaintext), cipher.final(), cipher.getAuthTag());
    },

    aesGcmDecrypt: (key, nonce, sealed, aad) => {
      if (sealed.length < gcmTagLength) throw new Error('Datos cifrados incompletos');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce, {
        authTagLength: gcmTagLength,
      });
      decipher.setAAD(aad);
      decipher.setAuthTag(sealed.subarray(sealed.length - gcmTagLength));
      const body = decipher.update(sealed.subarray(0, sealed.length - gcmTagLength));
      // final() verifica la etiqueta; si falla, lanza y no se devuelve nada.
      return joinOutput(body, decipher.final());
    },
  };
}
