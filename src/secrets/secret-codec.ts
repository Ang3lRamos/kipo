import {
  secretKinds,
  subscriptionPeriods,
  type CustomField,
  type SecretData,
  type SubscriptionPeriod,
} from '@/types/secret';

// Lee los datos de una clave guardados como JSON (en la base o bajados de la nube), verifica
// su forma y completa los campos que no existían en versiones anteriores (campos adicionales,
// contraseña y perfil de las suscripciones), para que las claves viejas sigan funcionando.

const text = (value: unknown): value is string => typeof value === 'string';
const orEmpty = (value: unknown): string => (text(value) ? value : '');

function parseFields(value: unknown): CustomField[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error('Campos adicionales inválidos');
  return value.map((field: unknown) => {
    const f = field as Record<string, unknown>;
    if (!text(f?.id) || !text(f.label) || !text(f.value) || typeof f.secret !== 'boolean') {
      throw new Error('Campo adicional inválido');
    }
    return { id: f.id, label: f.label, value: f.value, secret: f.secret };
  });
}

export function parseSecretData(value: unknown): SecretData {
  if (typeof value !== 'object' || value === null) throw new Error('Clave con formato inválido');
  const d = value as Record<string, unknown>;
  if (!secretKinds.includes(d.kind as never)) throw new Error('Tipo de clave desconocido');
  const need = (...keys: string[]) => {
    if (!keys.every((key) => text(d[key]))) throw new Error('Clave con campos inválidos');
  };
  const fields = parseFields(d.fields);

  switch (d.kind) {
    case 'login':
      need('username', 'password', 'url', 'totp', 'notes');
      return {
        kind: 'login',
        username: orEmpty(d.username),
        password: orEmpty(d.password),
        url: orEmpty(d.url),
        totp: orEmpty(d.totp),
        notes: orEmpty(d.notes),
        fields,
      };
    case 'note':
      need('body');
      return { kind: 'note', body: orEmpty(d.body), fields };
    case 'card':
      need('bank', 'last4', 'holder', 'notes');
      return {
        kind: 'card',
        bank: orEmpty(d.bank),
        last4: orEmpty(d.last4),
        holder: orEmpty(d.holder),
        notes: orEmpty(d.notes),
        fields,
      };
    default: {
      need('service', 'account', 'amount', 'renewsAt', 'notes');
      if (!subscriptionPeriods.includes(d.period as never)) throw new Error('Periodo inválido');
      return {
        kind: 'subscription',
        service: orEmpty(d.service),
        account: orEmpty(d.account),
        password: orEmpty(d.password),
        profile: orEmpty(d.profile),
        amount: orEmpty(d.amount),
        period: d.period as SubscriptionPeriod,
        renewsAt: orEmpty(d.renewsAt),
        notes: orEmpty(d.notes),
        fields,
      };
    }
  }
}
