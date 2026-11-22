import type { Category, DocumentInput, DocumentRecord } from '@/types/document';

import { isValidIsoDate } from './dates';

// Valores del formulario tal como se escriben (todo texto).
export type FormValues = {
  title: string;
  category: Category;
  tags: string; // separadas por comas
  physicalLocation: string;
  issuedAt: string;
  expiresAt: string;
  notes: string;
};

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export type FormResult = { ok: true; input: DocumentInput } | { ok: false; errors: FormErrors };

export const emptyFormValues: FormValues = {
  title: '',
  category: 'otro',
  tags: '',
  physicalLocation: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
};

export function formValuesFrom(doc: DocumentRecord): FormValues {
  return {
    title: doc.title,
    category: doc.category,
    tags: doc.tags.join(', '),
    physicalLocation: doc.physicalLocation ?? '',
    issuedAt: doc.issuedAt ?? '',
    expiresAt: doc.expiresAt ?? '',
    notes: doc.notes ?? '',
  };
}

export function parseTagList(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const tag = part.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function validateForm(values: FormValues): FormResult {
  const errors: FormErrors = {};
  const issuedAt = optional(values.issuedAt);
  const expiresAt = optional(values.expiresAt);

  if (values.title.trim() === '') errors.title = 'Escribe un nombre para el documento';
  if (issuedAt && !isValidIsoDate(issuedAt)) errors.issuedAt = 'Usa el formato AAAA-MM-DD';
  if (expiresAt && !isValidIsoDate(expiresAt)) errors.expiresAt = 'Usa el formato AAAA-MM-DD';
  if (issuedAt && expiresAt && !errors.issuedAt && !errors.expiresAt && expiresAt < issuedAt) {
    errors.expiresAt = 'El vencimiento no puede ser antes de la expedición';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    input: {
      title: values.title.trim(),
      category: values.category,
      tags: parseTagList(values.tags),
      physicalLocation: optional(values.physicalLocation),
      issuedAt,
      expiresAt,
      notes: optional(values.notes),
    },
  };
}
