import type { SQLiteDatabase } from 'expo-sqlite';

import { getSetting, setSetting } from '@/db/settings-repo';

import { ensurePermission, replaceScheduled } from './notifier';
import { maxScheduled, parseOffsets, planReminders } from './reminder-plan';
import { renewalReminders } from './renewal-plan';
import { parseSecretData } from '@/secrets/secret-codec';

const offsetsKey = 'reminder_offsets';

export async function loadReminderOffsets(db: SQLiteDatabase): Promise<number[]> {
  return parseOffsets(await getSetting(db, offsetsKey));
}

export async function saveReminderOffsets(db: SQLiteDatabase, offsets: number[]): Promise<void> {
  await setSetting(db, offsetsKey, JSON.stringify(offsets));
  await syncReminders(db);
}

// Renovaciones de las suscripciones con fecha: se calculan según el periodo (mensual o anual).
async function renewalPlan(db: SQLiteDatabase, now: Date) {
  const rows = await db.getAllAsync<{ id: string; data: string }>(
    `SELECT id, data FROM secrets WHERE deleted_at IS NULL AND kind = 'subscription'`,
  );
  return rows.flatMap((row) => {
    try {
      const data = parseSecretData(JSON.parse(row.data));
      return data.kind === 'subscription'
        ? renewalReminders(row.id, data.renewsAt, data.period, now)
        : [];
    } catch {
      return []; // una fila dañada no impide avisar de las demás
    }
  });
}

// Recalcula todos los avisos desde la base: se llama al abrir la bóveda y después de crear,
// editar o borrar un documento. Así nunca quedan avisos huérfanos de documentos borrados.
// Nunca lanza: un fallo de notificaciones no debe impedir guardar un documento.
export async function syncReminders(db: SQLiteDatabase): Promise<void> {
  try {
    const offsets = await loadReminderOffsets(db);
    const docs = await db.getAllAsync<{ id: string; expiresAt: string }>(
      `SELECT id, expires_at AS expiresAt FROM documents
       WHERE deleted_at IS NULL AND expires_at IS NOT NULL AND alerts_enabled = 1`,
    );
    const now = new Date();
    const plan = [...planReminders(docs, offsets, now), ...(await renewalPlan(db, now))]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, maxScheduled);
    if (plan.length > 0 && !(await ensurePermission())) return;
    await replaceScheduled(plan);
  } catch (error) {
    console.warn('No se pudieron programar los avisos de vencimiento', error);
  }
}
