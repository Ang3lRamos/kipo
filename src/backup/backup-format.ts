import { open, seal } from '@/crypto/aead';
import { fromBase64, toBase64, utf8 } from '@/crypto/bytes';
import type { CryptoPrimitives } from '@/crypto/primitives';

// Formato del respaldo .kipo (un solo archivo):
//
//   "KIPOBAK" + 0x01 | largo del encabezado (u32, big endian) | encabezado JSON | archivos
//
// El encabezado lleva el registro de la bóveda (la DEK envuelta con la contraseña y con la
// clave de recuperación: sin ellas no sirve) y el índice cifrado con la llave de metadatos.
// Los documentos y claves van como en la nube (cifrados con su AAD) y los archivos son los
// .bin del teléfono tal cual, ya cifrados con la llave de archivos. Nada viaja en claro.

export const backupMagic = utf8('KIPOBAK\x01');
const manifestAad = 'kipo/backup/manifest/v1';
const maxHeaderBytes = 64 * 1024 * 1024;

export type BackupRow = { id: string; updatedAt: string; payload: string };
export type BackupFile = {
  documentId: string;
  pageId: string;
  kind: 'page' | 'thumb';
  offset: number; // desde el inicio de la zona de archivos
  length: number;
};
export type BackupManifest = {
  v: 1;
  documents: BackupRow[];
  secrets: BackupRow[];
  files: BackupFile[];
};
export type BackupHeader = { v: 1; createdAt: string; vault: string; manifest: string };

export class InvalidBackupError extends Error {
  constructor(message = 'Este archivo no es un respaldo de Kipo') {
    super(message);
    this.name = 'InvalidBackupError';
  }
}

export function sealManifest(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  manifest: BackupManifest,
): string {
  return toBase64(seal(crypto, metaKey, utf8(JSON.stringify(manifest)), manifestAad));
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isCount = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const safeId = /^[A-Za-z0-9-]+$/;

function isRow(v: unknown): v is BackupRow {
  const r = v as Partial<BackupRow>;
  return isString(r?.id) && safeId.test(r.id) && isString(r.updatedAt) && isString(r.payload);
}

function isFile(v: unknown): v is BackupFile {
  const f = v as Partial<BackupFile>;
  return (
    isString(f?.documentId) &&
    safeId.test(f.documentId) &&
    isString(f.pageId) &&
    safeId.test(f.pageId) &&
    (f.kind === 'page' || f.kind === 'thumb') &&
    isCount(f.offset) &&
    isCount(f.length)
  );
}

// Lanza DecryptionError si la llave no es la de esta bóveda o si el índice fue alterado.
export function openManifest(
  crypto: CryptoPrimitives,
  metaKey: Uint8Array,
  sealed: string,
): BackupManifest {
  const plain = open(crypto, metaKey, fromBase64(sealed), manifestAad);
  const value = JSON.parse(new TextDecoder().decode(plain)) as Partial<BackupManifest>;
  const valid =
    value.v === 1 &&
    Array.isArray(value.documents) &&
    value.documents.every(isRow) &&
    Array.isArray(value.secrets) &&
    value.secrets.every(isRow) &&
    Array.isArray(value.files) &&
    value.files.every(isFile);
  if (!valid) throw new InvalidBackupError('El índice del respaldo está dañado');
  return value as BackupManifest;
}

// Lo que va antes de los archivos: firma + largo + encabezado.
export function encodePreamble(header: BackupHeader): Uint8Array {
  const json = utf8(JSON.stringify(header));
  const out = new Uint8Array(backupMagic.length + 4 + json.length);
  out.set(backupMagic, 0);
  new DataView(out.buffer).setUint32(backupMagic.length, json.length);
  out.set(json, backupMagic.length + 4);
  return out;
}

// Lee la firma y el largo del encabezado (los primeros 12 bytes).
export function readHeaderLength(start: Uint8Array): number {
  if (start.length < backupMagic.length + 4) throw new InvalidBackupError();
  for (let i = 0; i < backupMagic.length; i++) {
    if (start[i] !== backupMagic[i]) throw new InvalidBackupError();
  }
  const length = new DataView(start.buffer, start.byteOffset).getUint32(backupMagic.length);
  if (length === 0 || length > maxHeaderBytes) throw new InvalidBackupError();
  return length;
}

export const preambleSize = (headerLength: number) => backupMagic.length + 4 + headerLength;

export function parseHeader(json: Uint8Array): BackupHeader {
  let value: Partial<BackupHeader>;
  try {
    value = JSON.parse(new TextDecoder().decode(json)) as Partial<BackupHeader>;
  } catch {
    throw new InvalidBackupError();
  }
  if (value.v !== 1 || !isString(value.createdAt) || !isString(value.vault)) {
    throw new InvalidBackupError();
  }
  if (!isString(value.manifest)) throw new InvalidBackupError();
  return value as BackupHeader;
}

// "kipo-2026-11-23.kipo"
export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `kipo-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.kipo`;
}
