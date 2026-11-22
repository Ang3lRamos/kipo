import { DecryptionError } from './errors';
import { decryptFile, encryptFile, fileAad } from './file-crypto';
import { deriveSubkeys } from './subkeys';
import { nodePrimitives as crypto } from './testing/node-primitives';

const dek = crypto.randomBytes(32);
const { fileKey } = deriveSubkeys(dek);
const image = crypto.randomBytes(5000);

describe('cifrado de archivos', () => {
  it('ida y vuelta', () => {
    const aad = fileAad('page-1', 'page');
    expect(decryptFile(crypto, fileKey, encryptFile(crypto, fileKey, image, aad), aad)).toEqual(
      image,
    );
  });

  it('no permite cambiar un archivo por otro (la AAD liga el archivo a su página)', () => {
    const sealed = encryptFile(crypto, fileKey, image, fileAad('page-1', 'page'));
    expect(() => decryptFile(crypto, fileKey, sealed, fileAad('page-2', 'page'))).toThrow(
      DecryptionError,
    );
    expect(() => decryptFile(crypto, fileKey, sealed, fileAad('page-1', 'thumb'))).toThrow(
      DecryptionError,
    );
  });
});

describe('subllaves derivadas de la DEK', () => {
  it('son distintas entre sí y de la DEK, y deterministas', () => {
    const a = deriveSubkeys(dek);
    const b = deriveSubkeys(dek);
    expect(a.fileKey).toEqual(b.fileKey);
    expect(a.dbKey).toEqual(b.dbKey);
    expect(a.fileKey).not.toEqual(a.dbKey);
    expect(a.fileKey).not.toEqual(dek);
    expect(a.dbKey).toHaveLength(32);
  });

  it('exige una DEK de 32 bytes', () => {
    expect(() => deriveSubkeys(new Uint8Array(16))).toThrow();
  });
});
