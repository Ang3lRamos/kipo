import type { SQLiteDatabase } from 'expo-sqlite';

import { syncReminders } from '@/notifications/sync-reminders';

import { requestSync } from './sync-scheduler';

// Llamar después de crear, editar o borrar un documento o sus páginas.
export function afterLocalChange(db: SQLiteDatabase): void {
  void syncReminders(db);
  requestSync();
}
