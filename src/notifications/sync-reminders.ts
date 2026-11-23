import type { SQLiteDatabase } from 'expo-sqlite';

import { getSetting, setSetting } from '@/db/settings-repo';

import { ensurePermission, replaceScheduled } from './notifier';
import { parseOffsets, planReminders } from './reminder-plan';

const offsetsKey = 'reminder_offsets';

export async function loadReminderOffsets(db: SQLiteDatabase): Promise<number[]> {
  return parseOffsets(await getSetting(db, offsetsKey));
}

export async function saveReminderOffsets(db: SQLiteDatabase, offsets: number[]): Promise<void> {
  await setSetting(db, offsetsKey, JSON.stringify(offsets));
  await syncReminders(db);
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
    const plan = planReminders(docs, offsets, new Date());
    if (plan.length > 0 && !(await ensurePermission())) return;
    await replaceScheduled(plan);
  } catch (error) {
    console.warn('No se pudieron programar los avisos de vencimiento', error);
  }
}
