import { open, seal } from './aead';
import { DecryptionError } from './errors';
import { nodePrimitives as crypto } from './testing/node-primitives';

const key = crypto.randomBytes(32);
const plaintext = new TextEncoder().encode('Cédula 1.234.567 — original en la carpeta azul');
const aad = 'kipo/test/v1';

describe('AES-256-GCM (seal/open)', () => {
  it('ida y vuelta', () => {
    const sealed = seal(crypto, key, plaintext, aad);
    expect(open(crypto, key, sealed, aad)).toEqual(plaintext);
  });

  it('el texto cifrado no contiene el texto plano', () => {
    const sealed = seal(crypto, key, plaintext, aad);
    expect(Buffer.from(sealed).includes(Buffer.from('carpeta azul'))).toBe(false);
  });

  it('usa un nonce distinto en cada cifrado', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const sealed = seal(crypto, key, plaintext, aad);
      nonces.add(Buffer.from(sealed.subarray(1, 13)).toString('hex'));
    }
    expect(nonces.size).toBe(2000);
  });

  it('cifrar dos veces lo mismo da resultados distintos', () => {
    expect(seal(crypto, key, plaintext, aad)).not.toEqual(seal(crypto, key, plaintext, aad));
  });

  it('rechaza cualquier byte alterado (versión, nonce, datos o etiqueta)', () => {
    const sealed = seal(crypto, key, plaintext, aad);
    for (const position of [0, 1, 12, 13, 20, sealed.length - 17, sealed.length - 1]) {
      const tampered = Uint8Array.from(sealed);
      tampered[position] = (tampered[position] ?? 0) ^ 0x01;
      expect(() => open(crypto, key, tampered, aad)).toThrow(DecryptionError);
    }
  });

  it('rechaza datos truncados', () => {
    const sealed = seal(crypto, key, plaintext, aad);
    expect(() => open(crypto, key, sealed.subarray(0, 20), aad)).toThrow(DecryptionError);
    expect(() => open(crypto, key, new Uint8Array(0), aad)).toThrow(DecryptionError);
  });

  it('rechaza una llave o un contexto (AAD) distintos', () => {
    const sealed = seal(crypto, key, plaintext, aad);
    expect(() => open(crypto, crypto.randomBytes(32), sealed, aad)).toThrow(DecryptionError);
    expect(() => open(crypto, key, sealed, 'kipo/otro/v1')).toThrow(DecryptionError);
  });

  it('exige llaves de 32 bytes', () => {
    expect(() => seal(crypto, crypto.randomBytes(16), plaintext, aad)).toThrow();
  });

  it('cifra contenido vacío', () => {
    const sealed = seal(crypto, key, new Uint8Array(0), aad);
    expect(open(crypto, key, sealed, aad)).toEqual(new Uint8Array(0));
  });
});
