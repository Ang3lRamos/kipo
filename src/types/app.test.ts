import { appName } from './app';

describe('configuración base', () => {
  it('expone el nombre de la app', () => {
    expect(appName).toBe('Kipo');
  });
});
