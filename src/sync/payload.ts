import { isCategory } from '@/db/document-mapper';
import type { Category, DocumentRecord } from '@/types/document';
import type { DocumentPage, PageMimeType } from '@/types/page';

// Lo que viaja cifrado en documents.payload_enc. Versionado para poder cambiarlo después.

export type PagePayload = {
  id: string;
  position: number;
  mimeType: PageMimeType;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  hasThumb: boolean;
  createdAt: string;
  ocrText?: string | null; // fase 6; los documentos subidos antes no lo tienen
};

export type DocumentPayload = {
  v: 1;
  title: string;
  category: Category;
  tags: string[];
  physicalLocation: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  ocrText: string | null;
  alertsEnabled: boolean;
  createdAt: string;
  pages: PagePayload[];
};

export function buildPayload(doc: DocumentRecord, pages: DocumentPage[]): DocumentPayload {
  return {
    v: 1,
    title: doc.title,
    category: doc.category,
    tags: doc.tags,
    physicalLocation: doc.physicalLocation,
    issuedAt: doc.issuedAt,
    expiresAt: doc.expiresAt,
    notes: doc.notes,
    ocrText: doc.ocrText,
    alertsEnabled: doc.alertsEnabled,
    createdAt: doc.createdAt,
    pages: pages.map((page) => ({
      id: page.id,
      position: page.position,
      mimeType: page.mimeType,
      sizeBytes: page.sizeBytes,
      width: page.width,
      height: page.height,
      hasThumb: page.thumbPath !== null,
      createdAt: page.createdAt,
      ocrText: page.ocrText,
    })),
  };
}

const isText = (v: unknown): v is string => typeof v === 'string';
const isNullableText = (v: unknown): v is string | null => v === null || typeof v === 'string';
const isNullableInt = (v: unknown): v is number | null => v === null || Number.isInteger(v);

function isPage(value: unknown): value is PagePayload {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    isText(p.id) &&
    Number.isInteger(p.position) &&
    (p.mimeType === 'image/webp' || p.mimeType === 'application/pdf') &&
    Number.isInteger(p.sizeBytes) &&
    isNullableInt(p.width) &&
    isNullableInt(p.height) &&
    typeof p.hasThumb === 'boolean' &&
    isText(p.createdAt) &&
    (p.ocrText === undefined || isNullableText(p.ocrText))
  );
}

// Valida lo que llega de la nube antes de escribirlo en la base local.
export function parsePayload(value: unknown): DocumentPayload {
  if (typeof value !== 'object' || value === null) throw new Error('Contenido inválido');
  const d = value as Record<string, unknown>;
  const valid =
    d.v === 1 &&
    isText(d.title) &&
    isText(d.category) &&
    isCategory(d.category) &&
    Array.isArray(d.tags) &&
    d.tags.every(isText) &&
    isNullableText(d.physicalLocation) &&
    isNullableText(d.issuedAt) &&
    isNullableText(d.expiresAt) &&
    isNullableText(d.notes) &&
    isNullableText(d.ocrText) &&
    typeof d.alertsEnabled === 'boolean' &&
    isText(d.createdAt) &&
    Array.isArray(d.pages) &&
    d.pages.every(isPage);
  if (!valid) throw new Error('Contenido con formato desconocido');
  return value as DocumentPayload;
}
