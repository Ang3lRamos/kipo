import type { DocumentRecord } from '@/types/document';
import type { DocumentPage } from '@/types/page';

import { buildPayload, parsePayload } from './payload';

const doc: DocumentRecord = {
  id: 'd1',
  title: 'Pasaporte',
  category: 'identidad',
  tags: ['viaje'],
  physicalLocation: 'Carpeta azul',
  issuedAt: null,
  expiresAt: '2030-06-01',
  notes: null,
  ocrText: null,
  filePath: null,
  thumbPath: 'docs/d1/p1-thumb.bin',
  mimeType: 'image/webp',
  sizeBytes: 1000,
  createdAt: '2026-11-22T10:00:00.000Z',
  updatedAt: '2026-11-22T11:00:00.000Z',
  deletedAt: null,
  syncedAt: null,
  alertsEnabled: true,
};

const pages: DocumentPage[] = [
  {
    id: 'p1',
    documentId: 'd1',
    position: 0,
    filePath: 'docs/d1/p1.bin',
    thumbPath: 'docs/d1/p1-thumb.bin',
    mimeType: 'image/webp',
    sizeBytes: 900,
    width: 1800,
    height: 1350,
    createdAt: '2026-11-22T10:00:00.000Z',
  },
  {
    id: 'p2',
    documentId: 'd1',
    position: 1,
    filePath: 'docs/d1/p2.bin',
    thumbPath: null,
    mimeType: 'application/pdf',
    sizeBytes: 5000,
    width: null,
    height: null,
    createdAt: '2026-11-22T10:05:00.000Z',
  },
];

describe('contenido para la nube', () => {
  it('ida y vuelta, sin rutas locales', () => {
    const payload = buildPayload(doc, pages);
    const parsed = parsePayload(JSON.parse(JSON.stringify(payload)));
    expect(parsed).toEqual(payload);
    expect(JSON.stringify(payload)).not.toContain('docs/');
    expect(parsed.pages.map((p) => p.hasThumb)).toEqual([true, false]);
  });

  it('rechaza contenido con formato desconocido', () => {
    const payload = buildPayload(doc, pages);
    expect(() => parsePayload({ ...payload, v: 2 })).toThrow();
    expect(() => parsePayload({ ...payload, category: 'secreta' })).toThrow();
    expect(() => parsePayload({ ...payload, pages: [{ id: 'x' }] })).toThrow();
    expect(() => parsePayload('texto')).toThrow();
  });
});
