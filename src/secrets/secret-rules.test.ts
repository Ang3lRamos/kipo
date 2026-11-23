import type { CardData, SecretInput } from '@/types/secret';

import { emptySecretData, searchTextFor, secretSubtitle, validateSecret } from './secret-rules';

const login: SecretInput = {
  title: 'Router de la casa',
  data: {
    kind: 'login',
    username: 'admin',
    password: 'S3creta-Muy-Larga!',
    url: 'http://192.168.1.1/login',
    totp: '',
    notes: 'La clave del wifi es otra',
  },
};

describe('reglas de las claves', () => {
  it('pide un nombre', () => {
    expect(validateSecret({ ...login, title: '  ' }).title).toBeDefined();
    expect(validateSecret(login)).toEqual({});
  });

  it('la búsqueda nunca incluye la contraseña ni las notas', () => {
    const text = searchTextFor(login);
    expect(text).toContain('router');
    expect(text).toContain('admin');
    expect(text).toContain('192.168.1.1');
    expect(text).not.toContain('s3creta');
    expect(text).not.toContain('wifi');
  });

  it('valida la clave de dos pasos si se escribe', () => {
    const bad = { ...login, data: { ...login.data, totp: 'no-es-base32!' } } as SecretInput;
    expect(validateSecret(bad).totp).toBeDefined();
    const good = { ...login, data: { ...login.data, totp: 'JBSWY3DPEHPK3PXP' } } as SecretInput;
    expect(validateSecret(good).totp).toBeUndefined();
  });

  it('tarjeta: solo 4 dígitos y nunca el número completo en ningún campo', () => {
    const data: CardData = {
      kind: 'card',
      bank: 'Bancolombia',
      last4: '4242',
      holder: 'Angel',
      notes: '',
    };
    const card: SecretInput = { title: 'Visa Bancolombia', data };
    expect(validateSecret(card)).toEqual({});
    expect(validateSecret({ ...card, data: { ...data, last4: '42' } }).last4).toBeDefined();
    expect(
      validateSecret({ ...card, data: { ...data, notes: 'número 4111 1111 1111 1111' } }).notes,
    ).toMatch(/número completo/);
    expect(validateSecret({ ...card, title: 'Tarjeta 4111-1111-1111-1111' }).title).toMatch(
      /número completo/,
    );
    expect(secretSubtitle(data)).toBe('Bancolombia •••• 4242');
  });

  it('suscripción: valida la fecha de renovación', () => {
    const sub: SecretInput = {
      title: 'Netflix',
      data: {
        ...(emptySecretData('subscription') as Extract<
          SecretInput['data'],
          { kind: 'subscription' }
        >),
        service: 'Netflix',
        renewsAt: '31/12/2026',
      },
    };
    expect(validateSecret(sub).renewsAt).toBeDefined();
  });
});
