import { isValidIsoDate } from '@/features/documents/dates';
import { fold } from '@/ocr/text';
import type { SecretData, SecretInput, SecretKind } from '@/types/secret';

import { parseTotp } from './totp';

// Reglas de las claves: validación, protección contra números de tarjeta completos y el texto
// de búsqueda (que nunca incluye contraseñas, notas ni claves de dos pasos).

export function emptySecretData(kind: SecretKind): SecretData {
  switch (kind) {
    case 'login':
      return { kind, username: '', password: '', url: '', totp: '', notes: '' };
    case 'note':
      return { kind, body: '' };
    case 'card':
      return { kind, bank: '', last4: '', holder: '', notes: '' };
    case 'subscription':
      return {
        kind,
        service: '',
        account: '',
        amount: '',
        period: 'mensual',
        renewsAt: '',
        notes: '',
      };
  }
}

// 13 a 19 dígitos seguidos (con espacios o guiones): parece un número de tarjeta completo.
const fullCardNumber = /(?:\d[ -]?){12,18}\d/;

export type SecretErrors = Partial<Record<string, string>>;

export function validateSecret(input: SecretInput): SecretErrors {
  const errors: SecretErrors = {};
  const { data } = input;
  if (!input.title.trim()) errors.title = 'Ponle un nombre para encontrarla';

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
      if (fullCardNumber.test(data[field])) {
        errors[field] = 'Por seguridad, no guardes el número completo de la tarjeta';
      }
    }
  }
  if (data.kind === 'subscription' && data.renewsAt.trim() && !isValidIsoDate(data.renewsAt)) {
    errors.renewsAt = 'Usa el formato AAAA-MM-DD';
  }
  if (fullCardNumber.test(input.title)) {
    errors.title = 'Por seguridad, no guardes el número completo de la tarjeta';
  }
  return errors;
}

function hostOf(url: string): string {
  return url.replace(/^[a-z]+:\/\//i, '').split(/[/?#]/)[0] ?? '';
}

// Lo único que se usa para buscar. Contraseñas, notas y claves de dos pasos quedan fuera.
export function searchTextFor(input: SecretInput): string {
  const { data } = input;
  const parts = [input.title];
  if (data.kind === 'login') parts.push(data.username, data.url, hostOf(data.url));
  if (data.kind === 'card') parts.push(data.bank, data.holder, data.last4);
  if (data.kind === 'subscription') parts.push(data.service, data.account);
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
      return [data.service, data.amount && `${data.amount} ${data.period}`]
        .filter(Boolean)
        .join(' · ');
  }
}
