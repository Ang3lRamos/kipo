import { documentDir, pageFilePath, pageThumbPath } from './storage-paths';

const docId = '0b7c8f1e-1d2a-4c3b-9e8f-123456789abc';
const pageId = '9f8e7d6c-5b4a-4321-8765-0fedcba98765';

describe('rutas de almacenamiento', () => {
  it('arma rutas relativas por documento y página', () => {
    expect(documentDir(docId)).toBe(`docs/${docId}`);
    expect(pageFilePath(docId, pageId, 'webp')).toBe(`docs/${docId}/${pageId}.webp`);
    expect(pageThumbPath(docId, pageId)).toBe(`docs/${docId}/${pageId}-thumb.webp`);
  });

  it('rechaza ids que podrían salir de la carpeta', () => {
    expect(() => documentDir('../secretos')).toThrow();
    expect(() => pageFilePath(docId, 'a/b', 'pdf')).toThrow();
  });
});
