import { secretKinds, subscriptionPeriods, type SecretData } from '@/types/secret';

// Lee los datos de una clave guardados como JSON (en la base o bajados de la nube) y verifica
// que tengan la forma esperada antes de usarlos.

const text = (value: unknown): value is string => typeof value === 'string';

export function parseSecretData(value: unknown): SecretData {
  if (typeof value !== 'object' || value === null) throw new Error('Clave con formato inválido');
  const d = value as Record<string, unknown>;
  if (!secretKinds.includes(d.kind as never)) throw new Error('Tipo de clave desconocido');
  const all = (...keys: string[]) => keys.every((key) => text(d[key]));

  const valid =
    (d.kind === 'login' && all('username', 'password', 'url', 'totp', 'notes')) ||
    (d.kind === 'note' && all('body')) ||
    (d.kind === 'card' && all('bank', 'last4', 'holder', 'notes')) ||
    (d.kind === 'subscription' &&
      all('service', 'account', 'amount', 'renewsAt', 'notes') &&
      subscriptionPeriods.includes(d.period as never));
  if (!valid) throw new Error('Clave con campos inválidos');
  return value as SecretData;
}
