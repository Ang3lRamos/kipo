import { isValidIsoDate } from '@/features/documents/dates';
import { fold } from '@/ocr/text';
import type { SecretData, SecretInput, SecretKind } from '@/types/secret';

import { parseTotp } from './totp';

// Reglas de las claves: validación, protección contra números de tarjeta completos y el texto
// de búsqueda (que nunca incluye contraseñas, notas, claves de dos pasos ni campos secretos).

export function emptySecretData(kind: SecretKind): SecretData {
  switch (kind) {
    case 'login':
      return { kind, username: '', password: '', url: '', totp: '', notes: '', fields: [] };
    case 'note':
      return { kind, body: '', fields: [] };
    case 'card':
      return { kind, bank: '', last4: '', holder: '', notes: '', fields: [] };
    case 'subscription':
      return {
        kind,
        service: '',
        account: '',
        password: '',
        profile: '',
        amount: '',
        period: 'mensual',
        renewsAt: '',
        notes: '',
        fields: [],
      };
  }
}

// 13 a 19 dígitos seguidos (con espacios o guiones): parece un número de tarjeta completo.
const fullCardNumber = /(?:\d[ -]?){12,18}\d/;
const cardMessage = 'Por seguridad, no guardes el número completo de una tarjeta';

export type SecretErrors = Partial<Record<string, string>>;

export function validateSecret(input: SecretInput): SecretErrors {
  const errors: SecretErrors = {};
  const { data } = input;
  if (!input.title.trim()) errors.title = 'Ponle un nombre para encontrarla';
  if (fullCardNumber.test(input.title)) errors.title = cardMessage;

  if (data.kind === 'login' && data.totp.trim()) {
    try {
      parseTotp(data.totp);
    } catch {
      errors.totp = 'La clave de dos pasos no es válida (base32 u otpauth://)';
    }
  }
  if (data.kind === 'card') {
    if (!/^\d{4}$/.test(data.last4)) errors.last4 = 'Escribe solo los últimos 4 dígitos';
    for (const field of ['bank', 'holder', 'notes'] as const) {
      if (fullCardNumber.test(data[field])) errors[field] = cardMessage;
    }
  }
  if (data.kind === 'subscription' && data.renewsAt.trim() && !isValidIsoDate(data.renewsAt)) {
    errors.renewsAt = 'Usa el formato AAAA-MM-DD';
  }
  // Campos adicionales: con nombre si tienen valor, y nunca un número de tarjeta completo.
  for (const field of data.fields) {
    if (field.value.trim() && !field.label.trim()) errors[`field:${field.id}`] = 'Ponle un nombre';
    if (data.kind === 'card' && fullCardNumber.test(field.value)) {
      errors[`field:${field.id}`] = cardMessage;
    }
  }
  return errors;
}

function hostOf(url: string): string {
  return url.replace(/^[a-z]+:\/\//i, '').split(/[/?#]/)[0] ?? '';
}

// Lo único que se usa para buscar. Contraseñas, notas, claves de dos pasos y campos marcados
// como secretos quedan fuera.
export function searchTextFor(input: SecretInput): string {
  const { data } = input;
  const parts = [input.title];
  if (data.kind === 'login') parts.push(data.username, data.url, hostOf(data.url));
  if (data.kind === 'card') parts.push(data.bank, data.holder, data.last4);
  if (data.kind === 'subscription') parts.push(data.service, data.account, data.profile);
  for (const field of data.fields) {
    parts.push(field.label);
    if (!field.secret) parts.push(field.value);
  }
  return fold(parts.filter(Boolean).join(' '));
}

// El subtítulo de la lista (lo que se ve sin abrir la clave).
export function secretSubtitle(data: SecretData): string {
  switch (data.kind) {
    case 'login':
      return data.username || hostOf(data.url) || 'Inicio de sesión';
    case 'note':
      return 'Nota segura';
    case 'card':
      return [data.bank, data.last4 ? `•••• ${data.last4}` : ''].filter(Boolean).join(' ');
    case 'subscription':
      return [data.account || data.service, data.profile && `perfil ${data.profile}`]
        .filter(Boolean)
        .join(' · ');
  }
}
