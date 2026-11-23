import { addDays, isValidIsoDate } from '@/features/documents/dates';

// Cuántos días antes del vencimiento se avisa. El usuario elige entre estas opciones.
export const reminderOptions = [60, 30, 14, 7, 3, 1, 0] as const;
export const defaultOffsets: number[] = [60, 30, 7, 1];
export const reminderHour = 9; // 9:00 a. m., hora del teléfono

// Android permite muchas alarmas, pero iOS solo 64 pendientes: se programan las más cercanas.
export const maxScheduled = 60;

export function parseOffsets(raw: string | null): number[] {
  if (!raw) return defaultOffsets;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultOffsets;
    const valid = parsed.filter(
      (n): n is number =>
        typeof n === 'number' && (reminderOptions as readonly number[]).includes(n),
    );
    return [...new Set(valid)].sort((a, b) => b - a);
  } catch {
    return defaultOffsets;
  }
}

// `kind` renewal = renovación de una suscripción; `key` distingue sus varias fechas.
export type PlannedReminder = {
  documentId: string;
  offset: number;
  date: Date;
  kind?: 'renewal';
  key?: string;
};

function atHour(iso: string, hour: number): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1, hour, 0, 0, 0);
}

// Fechas de aviso futuras para un documento (las que ya pasaron se omiten).
export function remindersFor(
  documentId: string,
  expiresAt: string,
  offsets: number[],
  now: Date,
): PlannedReminder[] {
  if (!isValidIsoDate(expiresAt)) return [];
  return offsets
    .map((offset) => ({
      documentId,
      offset,
      date: atHour(addDays(expiresAt, -offset), reminderHour),
    }))
    .filter((reminder) => reminder.date.getTime() > now.getTime());
}

export function planReminders(
  docs: { id: string; expiresAt: string }[],
  offsets: number[],
  now: Date,
): PlannedReminder[] {
  return docs
    .flatMap((doc) => remindersFor(doc.id, doc.expiresAt, offsets, now))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, maxScheduled);
}

// El texto se ve con el teléfono bloqueado: nunca incluye el nombre del documento.
export function reminderText(offset: number): string {
  if (offset === 0) return 'Hoy vence uno de tus documentos.';
  if (offset === 1) return 'Mañana vence uno de tus documentos.';
  return `Tienes un documento que vence en ${offset} días.`;
}

function joinList(items: string[]): string {
  return items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;
}

export function describeOffsets(offsets: number[]): string {
  if (offsets.length === 0) return 'Sin avisos';
  const before = offsets.filter((o) => o > 0);
  const parts: string[] = [];
  if (before.length > 0) {
    const unit = before.length === 1 && before[0] === 1 ? 'día' : 'días';
    parts.push(`${joinList(before.map(String))} ${unit} antes`);
  }
  if (offsets.includes(0)) parts.push('el mismo día');
  return parts.join(' y ');
}
