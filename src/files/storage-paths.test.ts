import {
  documentDir,
  isEncryptedPath,
  pageFilePath,
  pageIdFromThumbPath,
  pageThumbPath,
} from './storage-paths';

const docId = '0b7c8f1e-1d2a-4c3b-9e8f-123456789abc';
const pageId = '9f8e7d6c-5b4a-4321-8765-0fedcba98765';

describe('rutas de almacenamiento', () => {
  it('arma rutas relativas cifradas por documento y página', () => {
    expect(documentDir(docId)).toBe(`docs/${docId}`);
    expect(pageFilePath(docId, pageId)).toBe(`docs/${docId}/${pageId}.bin`);
    expect(pageThumbPath(docId, pageId)).toBe(`docs/${docId}/${pageId}-thumb.bin`);
  });

  it('recupera la página a partir de la ruta de la miniatura', () => {
    expect(pageIdFromThumbPath(pageThumbPath(docId, pageId))).toBe(pageId);
    expect(pageIdFromThumbPath(`docs/${docId}/${pageId}-thumb.webp`)).toBeNull();
  });

  it('distingue archivos cifrados de los de la fase 2', () => {
    expect(isEncryptedPath(pageFilePath(docId, pageId))).toBe(true);
    expect(isEncryptedPath(`docs/${docId}/${pageId}.webp`)).toBe(false);
  });

  it('rechaza ids que podrían salir de la carpeta', () => {
    expect(() => documentDir('../secretos')).toThrow();
    expect(() => pageFilePath(docId, 'a/b')).toThrow();
  });
});
