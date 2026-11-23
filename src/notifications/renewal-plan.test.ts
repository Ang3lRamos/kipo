import { nextRenewals, renewalReminders, renewalText } from './renewal-plan';

describe('próximas renovaciones', () => {
  it('mensual: avanza mes a mes desde la fecha escrita, aunque ya haya pasado', () => {
    expect(nextRenewals('2026-08-15', 'mensual', '2026-11-23')).toEqual([
      '2026-12-15',
      '2027-01-15',
      '2027-02-15',
    ]);
  });

  it('mensual el 31: usa el último día de los meses cortos y vuelve al 31', () => {
    expect(nextRenewals('2027-01-31', 'mensual', '2027-01-01')).toEqual([
      '2027-01-31',
      '2027-02-28',
      '2027-03-31',
    ]);
  });

  it('anual: el mismo día cada año (29 de febrero → 28 en años no bisiestos)', () => {
    expect(nextRenewals('2024-02-29', 'anual', '2026-11-23')).toEqual(['2027-02-28', '2028-02-29']);
  });

  it('si hoy es el día de la renovación, cuenta', () => {
    expect(nextRenewals('2026-11-23', 'mensual', '2026-11-23')[0]).toBe('2026-11-23');
  });

  it('periodo "otro": solo la fecha escrita, si no ha pasado', () => {
    expect(nextRenewals('2027-05-01', 'otro', '2026-11-23')).toEqual(['2027-05-01']);
    expect(nextRenewals('2026-05-01', 'otro', '2026-11-23')).toEqual([]);
  });

  it('fecha inválida: nada', () => {
    expect(nextRenewals('31/02/2027', 'mensual', '2026-11-23')).toEqual([]);
  });
});

describe('avisos de renovación', () => {
  it('avisa 3 días antes y el mismo día a las 9:00, solo en el futuro', () => {
    const now = new Date(2026, 11, 13, 12, 0); // 13 dic 2026, mediodía
    const plan = renewalReminders('s1', '2026-12-15', 'mensual', now);
    // El aviso de "3 días antes" del 15 de dic (12 dic) ya pasó.
    expect(plan[0]).toMatchObject({ offset: 0, date: new Date(2026, 11, 15, 9) });
    expect(plan[1]).toMatchObject({ offset: 3, date: new Date(2027, 0, 12, 9) });
  });

  it('el texto nunca dice qué suscripción es', () => {
    expect(renewalText(0)).toBe('Hoy se renueva una de tus suscripciones.');
    expect(renewalText(3)).toBe('Una de tus suscripciones se renueva en 3 días.');
  });
});
