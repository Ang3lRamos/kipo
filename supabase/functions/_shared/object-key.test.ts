import { objectKey, parseObjectRequest } from './object-key';

const user = '11111111-2222-4333-8444-555555555555';
const doc = 'AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE';
const page = '99999999-8888-4777-8666-555555555555';

describe('rutas de R2', () => {
  it('arma la ruta desde el usuario del JWT', () => {
    const request = parseObjectRequest({ documentId: doc, pageId: page, kind: 'thumb' });
    expect(request).not.toBeNull();
    if (!request) return;
    expect(objectKey(user, request)).toBe(`${user}/${doc.toLowerCase()}/${page}/thumb`);
  });

  it('rechaza intentos de salir de la carpeta del usuario', () => {
    expect(parseObjectRequest({ documentId: '../otro', pageId: page, kind: 'page' })).toBeNull();
    expect(
      parseObjectRequest({ documentId: doc, pageId: `${page}/../x`, kind: 'page' }),
    ).toBeNull();
    expect(parseObjectRequest({ documentId: doc, pageId: page, kind: 'otro' })).toBeNull();
    expect(parseObjectRequest('texto')).toBeNull();
    expect(parseObjectRequest(null)).toBeNull();
  });

  it('no acepta un usuario que no sea UUID', () => {
    const request = parseObjectRequest({ documentId: doc, pageId: page, kind: 'page' });
    if (!request) throw new Error('debía ser válido');
    expect(() => objectKey('anon', request)).toThrow();
  });
});
