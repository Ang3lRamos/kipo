// Claves y notas seguras (fase 7). Los datos viven en la base cifrada (SQLCipher) y viajan
// a la nube cifrados con la llave de metadatos.

export const secretKinds = ['login', 'note', 'card', 'subscription'] as const;
export type SecretKind = (typeof secretKinds)[number];

// Campo libre que se agrega a cualquier clave: PIN del perfil, red wifi, pregunta de
// seguridad… `secret: true` lo oculta en pantalla y lo deja fuera de la búsqueda.
export type CustomField = { id: string; label: string; value: string; secret: boolean };

export type LoginData = {
  kind: 'login';
  username: string;
  password: string;
  url: string;
  totp: string; // clave base32 u otpauth:// para los códigos de dos pasos
  notes: string;
  fields: CustomField[];
};

export type NoteData = { kind: 'note'; body: string; fields: CustomField[] };

// Solo el banco y los últimos 4 dígitos: nunca el número completo ni el CVV.
export type CardData = {
  kind: 'card';
  bank: string;
  last4: string;
  holder: string;
  notes: string;
  fields: CustomField[];
};

export const subscriptionPeriods = ['mensual', 'anual', 'otro'] as const;
export type SubscriptionPeriod = (typeof subscriptionPeriods)[number];

export type SubscriptionData = {
  kind: 'subscription';
  service: string;
  account: string; // correo o usuario
  password: string;
  profile: string; // perfil dentro del servicio (por ejemplo, el de Netflix)
  amount: string;
  period: SubscriptionPeriod;
  renewsAt: string; // AAAA-MM-DD o vacío
  notes: string;
  fields: CustomField[];
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
