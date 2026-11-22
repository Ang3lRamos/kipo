// Fechas de calendario en formato AAAA-MM-DD, en la zona horaria local del teléfono.

const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const msPerDay = 24 * 60 * 60 * 1000;

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIso(value: string): Date | null {
  const match = isoDatePattern.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  if (y === undefined || m === undefined || d === undefined) return null;
  const date = new Date(y, m - 1, d);
  // Rechaza fechas que JS "corrige", como 2026-02-30.
  const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return valid ? date : null;
}

export function isValidIsoDate(value: string): boolean {
  return parseIso(value) !== null;
}

export function todayIso(now: Date = new Date()): string {
  return toIso(now);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  if (!date) throw new Error(`Fecha inválida: ${iso}`);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

// Días que faltan desde `fromIso` hasta `iso`; negativo si ya pasó.
export function daysUntil(iso: string, fromIso: string): number {
  const target = parseIso(iso);
  const from = parseIso(fromIso);
  if (!target || !from) return Number.NaN;
  // Math.round absorbe el cambio de horario de verano.
  return Math.round((target.getTime() - from.getTime()) / msPerDay);
}

export function formatDate(iso: string): string {
  const date = parseIso(iso);
  if (!date) return iso;
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function describeExpiry(iso: string, fromIso: string): string {
  const days = daysUntil(iso, fromIso);
  if (Number.isNaN(days)) return '';
  if (days < 0) return days === -1 ? 'Venció ayer' : `Venció hace ${-days} días`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence mañana';
  return `Vence en ${days} días`;
}
