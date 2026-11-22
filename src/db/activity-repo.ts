import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { activityActions, type ActivityAction, type ActivityEntry } from '@/types/document';

type ActivityRow = { id: string; document_id: string; action: string; created_at: string };

function isAction(value: string): value is ActivityAction {
  return (activityActions as readonly string[]).includes(value);
}

export async function logActivity(
  db: SQLiteDatabase,
  documentId: string,
  action: ActivityAction,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO activity_log (id, document_id, action, created_at) VALUES (?, ?, ?, ?)',
    randomUUID(),
    documentId,
    action,
    new Date().toISOString(),
  );
}

export async function listActivity(
  db: SQLiteDatabase,
  documentId: string,
  limit = 50,
): Promise<ActivityEntry[]> {
  const rows = await db.getAllAsync<ActivityRow>(
    'SELECT * FROM activity_log WHERE document_id = ? ORDER BY created_at DESC LIMIT ?',
    documentId,
    limit,
  );
  return rows.flatMap((row) =>
    isAction(row.action)
      ? [{ id: row.id, documentId: row.document_id, action: row.action, createdAt: row.created_at }]
      : [],
  );
}
