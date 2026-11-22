import { parseTags, rowToDocument, type DocumentRow } from './document-mapper';

const baseRow: DocumentRow = {
  id: 'a',
  title: 'Cédula',
  category: 'identidad',
  tags: '["personal","original"]',
  physical_location: 'Carpeta azul',
  issued_at: null,
  expires_at: '2030-01-01',
  notes: null,
  ocr_text: null,
  file_path: null,
  thumb_path: null,
  mime_type: null,
  size_bytes: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  deleted_at: null,
  synced_at: null,
};

describe('rowToDocument', () => {
  it('convierte a camelCase y lee las etiquetas', () => {
    const doc = rowToDocument(baseRow);
    expect(doc.physicalLocation).toBe('Carpeta azul');
    expect(doc.tags).toEqual(['personal', 'original']);
  });

  it('usa "otro" si la categoría no es válida', () => {
    expect(rowToDocument({ ...baseRow, category: 'xyz' }).category).toBe('otro');
  });
});

describe('parseTags', () => {
  it('tolera JSON inválido o con tipos extraños', () => {
    expect(parseTags('no es json')).toEqual([]);
    expect(parseTags('{"a":1}')).toEqual([]);
    expect(parseTags('["a",2,null,"b"]')).toEqual(['a', 'b']);
  });
});
