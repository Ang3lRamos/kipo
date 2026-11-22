import { addDays, daysUntil, describeExpiry, isValidIsoDate, todayIso } from './dates';

describe('fechas', () => {
  it('valida AAAA-MM-DD y rechaza fechas imposibles', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('28/02/2026')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });

  it('usa la fecha local para hoy', () => {
    expect(todayIso(new Date(2026, 10, 22, 23, 59))).toBe('2026-11-22');
  });

  it('suma días cruzando meses y años', () => {
    expect(addDays('2026-12-15', 60)).toBe('2027-02-13');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('cuenta los días que faltan', () => {
    expect(daysUntil('2026-11-29', '2026-11-22')).toBe(7);
    expect(daysUntil('2026-11-20', '2026-11-22')).toBe(-2);
  });

  it('describe el vencimiento en español', () => {
    expect(describeExpiry('2026-11-22', '2026-11-22')).toBe('Vence hoy');
    expect(describeExpiry('2026-11-23', '2026-11-22')).toBe('Vence mañana');
    expect(describeExpiry('2026-12-02', '2026-11-22')).toBe('Vence en 10 días');
    expect(describeExpiry('2026-11-19', '2026-11-22')).toBe('Venció hace 3 días');
  });
});
