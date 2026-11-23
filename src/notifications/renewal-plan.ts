import { isValidIsoDate, todayIso } from '@/features/documents/dates';
import type { SubscriptionPeriod } from '@/types/secret';

import { reminderHour, type PlannedReminder } from './reminder-plan';

// Renovaciones de suscripciones: a partir de una fecha y el periodo (mensual o anual) se
// calculan las próximas, y se avisa unos días antes de cada una.

export const renewalOffsets = [3, 0]; // 3 días antes y el mismo día, a las 9:00 a. m.
const upcomingCount: Record<SubscriptionPeriod, number> = { mensual: 3, anual: 2, otro: 1 };

const pad = (n: number) => String(n).padStart(2, '0');
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate(); // month 1-12

// Suma meses manteniendo el día de cobro original (31 → 30 en abril, y vuelve a 31 en mayo).
function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const total = y * 12 + (m - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${year}-${pad(month)}-${pad(Math.min(d, daysIn(year, month)))}`;
}

// La renovación número `n` desde la fecha inicial.
function occurrence(start: string, period: SubscriptionPeriod, n: number): string {
  return period === 'anual' ? addMonths(start, 12 * n) : addMonths(start, n);
}

// Próximas fechas de renovación desde hoy (incluido). Periodo "otro": solo la fecha escrita.
export function nextRenewals(
  renewsAt: string,
  period: SubscriptionPeriod,
  today: string = todayIso(),
): string[] {
  if (!isValidIsoDate(renewsAt)) return [];
  if (period === 'otro') return renewsAt >= today ? [renewsAt] : [];
  let n = 0;
  while (occurrence(renewsAt, period, n) < today) n++;
  return Array.from({ length: upcomingCount[period] }, (_, i) =>
    occurrence(renewsAt, period, n + i),
  );
}

const atHour = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, reminderHour, 0, 0, 0);
};

export function renewalReminders(
  id: string,
  renewsAt: string,
  period: SubscriptionPeriod,
  now: Date,
): PlannedReminder[] {
  const today = todayIso(now);
  return nextRenewals(renewsAt, period, today).flatMap((date) =>
    renewalOffsets
      .map((offset) => {
        const day = new Date(atHour(date));
        day.setDate(day.getDate() - offset);
        return { documentId: id, offset, date: day, kind: 'renewal' as const, key: date };
      })
      .filter((reminder) => reminder.date.getTime() > now.getTime()),
  );
}

// Nunca dice qué suscripción es: se ve con el teléfono bloqueado.
export function renewalText(offset: number): string {
  if (offset === 0) return 'Hoy se renueva una de tus suscripciones.';
  if (offset === 1) return 'Mañana se renueva una de tus suscripciones.';
  return `Una de tus suscripciones se renueva en ${offset} días.`;
}
