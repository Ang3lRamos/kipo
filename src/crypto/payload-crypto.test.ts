import { DecryptionError } from './errors';
import { decryptPayload, encryptPayload } from './payload-crypto';
import { deriveSubkeys } from './subkeys';
import { nodePrimitives as crypto } from './testing/node-primitives';

const { metaKey, fileKey, dbKey } = deriveSubkeys(crypto.randomBytes(32));
const payload = { title: 'Cédula de ciudadanía', physicalLocation: 'Carpeta azul', pages: [] };

describe('metadatos cifrados para la nube', () => {
  it('ida y vuelta', () => {
    const encoded = encryptPayload(crypto, metaKey, 'doc-1', payload);
    expect(decryptPayload(crypto, metaKey, 'doc-1', encoded)).toEqual(payload);
  });

  it('el texto cifrado no revela el contenido', () => {
    const encoded = encryptPayload(crypto, metaKey, 'doc-1', payload);
    const raw = Buffer.from(encoded, 'base64').toString('latin1');
    expect(raw).not.toContain('Carpeta azul');
    expect(encoded).not.toContain('Cédula');
  });

  it('no se puede mover el contenido a la fila de otro documento', () => {
    const encoded = encryptPayload(crypto, metaKey, 'doc-1', payload);
    expect(() => decryptPayload(crypto, metaKey, 'doc-2', encoded)).toThrow(DecryptionError);
  });

  it('la llave de metadatos es distinta de las de archivos y base', () => {
    expect(metaKey).not.toEqual(fileKey);
    expect(metaKey).not.toEqual(dbKey);
    const encoded = encryptPayload(crypto, metaKey, 'doc-1', payload);
    expect(() => decryptPayload(crypto, fileKey, 'doc-1', encoded)).toThrow(DecryptionError);
  });
});
