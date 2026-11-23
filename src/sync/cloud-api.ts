import { File, UploadType } from 'expo-file-system';

import type { VaultRecord } from '@/crypto/vault';

import { supabase } from './supabase-client';
import { recordToRow, rowToRecord, type VaultRow } from './vault-row';

// Operaciones contra Supabase y R2. Todo lo que se envía ya está cifrado.

export type RemoteDocument = {
  id: string;
  payload_enc: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at: string;
};

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function fetchRemoteVault(): Promise<VaultRecord | null> {
  const { data, error } = await supabase()
    .from('vault_keys')
    .select('wrapped_dek, wrapped_dek_recovery, kdf_salt, kdf_params')
    .maybeSingle<VaultRow>();
  fail(error);
  return data ? rowToRecord(data) : null;
}

export async function pushVault(record: VaultRecord): Promise<void> {
  const { error } = await supabase().from('vault_keys').upsert(recordToRow(record));
  fail(error);
}

// Gana el updated_at más reciente; lo decide la función de Postgres en un solo paso.
export async function upsertRemoteDocument(
  id: string,
  payloadEnc: string,
  updatedAt: string,
  deletedAt: string | null,
): Promise<boolean> {
  const { data, error } = await supabase().rpc('kipo_upsert_document', {
    p_id: id,
    p_payload: payloadEnc,
    p_updated_at: updatedAt,
    p_deleted_at: deletedAt,
  });
  fail(error);
  return data === true;
}

// Posición de la última fila descargada. Lleva también el id porque varias filas pueden
// compartir server_updated_at (misma transacción) y quedar partidas entre dos lotes.
export type SyncCursor = { at: string; id: string };

// Cambios después del cursor (reloj del servidor), en orden estable, de a lotes.
export async function fetchChangesSince(
  cursor: SyncCursor | null,
  limit = 100,
): Promise<RemoteDocument[]> {
  let query = supabase()
    .from('documents')
    .select('id, payload_enc, updated_at, deleted_at, server_updated_at')
    .order('server_updated_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(limit);
  if (cursor) {
    // Valores entre comillas dobles: la fecha trae ":" y "+", que PostgREST interpreta.
    const at = `"${cursor.at}"`;
    query = query.or(
      `server_updated_at.gt.${at},and(server_updated_at.eq.${at},id.gt.${cursor.id})`,
    );
  }
  const { data, error } = await query.returns<RemoteDocument[]>();
  fail(error);
  return data ?? [];
}

type ObjectTarget = { documentId: string; pageId: string; kind: 'page' | 'thumb' };

// supabase-js solo dice "non-2xx status code": aquí se saca el código HTTP y el motivo que
// devolvió la función ({ error: "..." }) para poder diagnosticarlo desde la app.
async function functionErrorMessage(fn: string, error: { message: string }): Promise<string> {
  // En React Native el objeto no siempre es instancia del Response global (hay dos
  // implementaciones), así que se reconoce por su forma y no con instanceof.
  type ResponseLike = { status: number; json: () => Promise<unknown>; text: () => Promise<string> };
  const context = (error as { context?: unknown }).context;
  const looksLikeResponse =
    typeof context === 'object' &&
    context !== null &&
    typeof (context as { status?: unknown }).status === 'number' &&
    typeof (context as { text?: unknown }).text === 'function';
  if (!looksLikeResponse) return `${fn}: ${error.message}`;
  const response = context as ResponseLike;
  let raw = '';
  let detail = '';
  try {
    raw = await response.text();
    const body: unknown = JSON.parse(raw);
    if (typeof body === 'object' && body !== null) {
      const { error: reason, message, msg } = body as Record<string, unknown>;
      detail = String(reason ?? message ?? msg ?? '');
    }
  } catch {
    // No era JSON (o el cuerpo ya se había leído): se muestra el texto tal cual, recortado.
    detail = raw.slice(0, 200);
  }
  return `${fn} respondió ${response.status}${detail ? `: ${detail}` : ''}`;
}

async function presignedUrl(fn: 'upload-url' | 'download-url', target: ObjectTarget) {
  const { data, error } = await supabase().functions.invoke<{ url: string }>(fn, { body: target });
  if (error) throw new Error(await functionErrorMessage(fn, error));
  if (!data?.url) throw new Error(`${fn} no devolvió una URL`);
  return data.url;
}

// Sube un .bin del almacenamiento local tal cual: ya está cifrado con la llave de archivos.
// La transferencia es nativa (expo-file-system): el archivo no pasa por la memoria de JS.
export async function uploadObject(target: ObjectTarget, encrypted: File): Promise<void> {
  const url = await presignedUrl('upload-url', target);
  const result = await encrypted.upload(url, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    headers: { 'Content-Type': 'application/octet-stream' },
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`R2 rechazó la subida (${result.status})`);
  }
}

// Formato de Kipo (src/crypto/aead.ts): versión 1 + nonce 12 + etiqueta 16 como mínimo.
function looksEncrypted(file: File): boolean {
  if (!file.exists || file.size < 29) return false;
  const handle = file.open();
  try {
    return handle.readBytesSync(1)[0] === 1;
  } finally {
    handle.close();
  }
}

// Baja un archivo cifrado directo a su ruta local. Si R2 devolvió otra cosa (un error en XML,
// por ejemplo), se borra y falla: nunca queda un archivo que no sea de Kipo.
export async function downloadObject(target: ObjectTarget, destination: File): Promise<void> {
  const url = await presignedUrl('download-url', target);
  destination.parentDirectory.create({ intermediates: true, idempotent: true });
  await File.downloadFileAsync(url, destination, { idempotent: true });
  if (!looksEncrypted(destination)) {
    if (destination.exists) destination.delete();
    throw new Error('R2 devolvió un archivo que no es de Kipo');
  }
}
