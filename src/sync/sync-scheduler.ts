import type { SQLiteDatabase } from 'expo-sqlite';

import type { Subkeys } from '@/crypto/subkeys';
import type { VaultRecord } from '@/crypto/vault';
import { syncReminders } from '@/notifications/sync-reminders';

import { cloudStatus } from './cloud-auth';
import { runSync, type SyncSummary } from './sync-engine';

// Coordina cuándo sincronizar: al abrir la bóveda, unos segundos después de cada cambio y a
// pedido. Nunca corren dos a la vez. Sin sesión lista (con segundo factor) no hace nada.

type Context = { db: SQLiteDatabase; keys: Subkeys; record: VaultRecord };
export type SyncState =
  | { kind: 'idle'; last?: SyncSummary; at?: string }
  | { kind: 'syncing' }
  | { kind: 'error'; message: string; at: string };

let context: Context | null = null;
let running: Promise<SyncSummary | null> | null = null;
let rerun = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let state: SyncState = { kind: 'idle' };
const listeners = new Set<(state: SyncState) => void>();

function setState(next: SyncState) {
  state = next;
  listeners.forEach((listener) => listener(next));
}

export function setSyncContext(next: Context): void {
  context = next;
}

export function updateSyncRecord(record: VaultRecord): void {
  if (context) context = { ...context, record };
}

// Al bloquear: sin contexto no se usa ninguna llave (ya borradas).
export function clearSyncContext(): void {
  context = null;
  if (timer) clearTimeout(timer);
  timer = null;
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSync(listener: (state: SyncState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function runOnce(): Promise<SyncSummary | null> {
  const current = context;
  if (!current || (await cloudStatus()).kind !== 'ready') return null;
  setState({ kind: 'syncing' });
  try {
    const summary = await runSync(current.db, current.keys, current.record);
    if (summary.downloaded > 0) await syncReminders(current.db); // fechas nuevas de otro teléfono
    setState({ kind: 'idle', last: summary, at: new Date().toISOString() });
    return summary;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('La sincronización falló', error);
    setState({ kind: 'error', message, at: new Date().toISOString() });
    return null;
  }
}

export async function syncNow(): Promise<SyncSummary | null> {
  if (running) {
    rerun = true; // otro cambio llegó durante la sincronización: repetir al terminar
    return running;
  }
  running = runOnce();
  try {
    return await running;
  } finally {
    running = null;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  }
}

export function requestSync(delayMs = 3000): void {
  if (!context) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delayMs);
}
