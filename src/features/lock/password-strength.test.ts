import { minAcceptableScore, rateMasterPassword } from './password-strength';

describe('medidor de fortaleza de la contraseña maestra', () => {
  it('rechaza contraseñas cortas o comunes', () => {
    expect(rateMasterPassword('').score).toBe(0);
    expect(rateMasterPassword('12345678').score).toBeLessThan(minAcceptableScore);
    expect(rateMasterPassword('contraseña123').score).toBeLessThan(minAcceptableScore);
    expect(rateMasterPassword('aaaaaaaaaaaaaaaa').score).toBeLessThan(minAcceptableScore);
  });

  it('acepta frases largas de varias palabras', () => {
    expect(rateMasterPassword('guayaba lámpara tren dormido').score).toBeGreaterThanOrEqual(
      minAcceptableScore,
    );
  });

  it('da la mejor puntuación a frases largas y variadas', () => {
    expect(rateMasterPassword('Guayaba-lámpara 7 trenes dormidos!').score).toBe(4);
  });

  it('explica qué falta', () => {
    expect(rateMasterPassword('corta').hint).toMatch(/caracteres/);
  });
});
