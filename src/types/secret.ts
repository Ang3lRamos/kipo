// Claves y notas seguras (fase 7). Los datos viven en la base cifrada (SQLCipher) y viajan
// a la nube cifrados con la llave de metadatos.

export const secretKinds = ['login', 'note', 'card', 'subscription'] as const;
export type SecretKind = (typeof secretKinds)[number];

export type LoginData = {
  kind: 'login';
  username: string;
  password: string;
  url: string;
  totp: string; // clave base32 u otpauth:// para los códigos de dos pasos
  notes: string;
};

export type NoteData = { kind: 'note'; body: string };

// Solo el banco y los últimos 4 dígitos: nunca el número completo ni el CVV.
export type CardData = { kind: 'card'; bank: string; last4: string; holder: string; notes: string };

export const subscriptionPeriods = ['mensual', 'anual', 'otro'] as const;
export type SubscriptionPeriod = (typeof subscriptionPeriods)[number];

export type SubscriptionData = {
  kind: 'subscription';
  service: string;
  account: string;
  amount: string;
  period: SubscriptionPeriod;
  renewsAt: string; // AAAA-MM-DD o vacío
  notes: string;
};

export type SecretData = LoginData | NoteData | CardData | SubscriptionData;

export type SecretRecord = {
  id: string;
  title: string;
  data: SecretData;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncedAt: string | null;
};

export type SecretInput = { title: string; data: SecretData };
