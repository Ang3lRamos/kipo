import { parseSecretData } from './secret-codec';

describe('lectura de claves guardadas', () => {
  it('las claves guardadas antes (sin campos adicionales ni contraseña en suscripciones) siguen sirviendo', () => {
    const old = {
      kind: 'subscription',
      service: 'Netflix',
      account: 'a@b.co',
      amount: '',
      period: 'mensual',
      renewsAt: '',
      notes: '',
    };
    expect(parseSecretData(old)).toMatchObject({ password: '', profile: '', fields: [] });
    expect(parseSecretData({ kind: 'note', body: 'PIN' })).toEqual({
      kind: 'note',
      body: 'PIN',
      fields: [],
    });
  });

  it('rechaza datos con forma desconocida', () => {
    expect(() => parseSecretData({ kind: 'otra' })).toThrow();
    expect(() => parseSecretData({ kind: 'note' })).toThrow();
    expect(() => parseSecretData({ kind: 'note', body: 'x', fields: [{ label: 1 }] })).toThrow();
  });
});
