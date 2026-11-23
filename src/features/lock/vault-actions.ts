import { wipe } from '@/crypto/bytes';
import { calibratePasses, defaultMemoryKiB } from '@/crypto/kdf';
import { nativePrimitives as crypto } from '@/crypto/native-primitives';
import { deriveSubkeys, type Subkeys } from '@/crypto/subkeys';
import {
  changePassword,
  createVault,
  unlockWithPassword,
  unlockWithRecoveryKey,
  type VaultRecord,
} from '@/crypto/vault';
import { saveVaultRecord } from '@/crypto/vault-store';

// Sesión desbloqueada. La DEK se conserva solo para volver a envolverla (cambio de
// contraseña, activar huella) y se borra al bloquear.
export type Session = { dek: Uint8Array; keys: Subkeys; record: VaultRecord };

export function openSession(dek: Uint8Array, record: VaultRecord): Session {
  return { dek, keys: deriveSubkeys(dek), record };
}

export function closeSession(session: Session): void {
  wipe(session.dek, session.keys.dbKey, session.keys.fileKey, session.keys.metaKey);
}

function costOf(record: VaultRecord) {
  const { memoryKiB, passes, parallelism } = record.kdf;
  return { memoryKiB, passes, parallelism };
}

// Crea la bóveda en memoria. No se guarda hasta que el usuario confirma la clave de recuperación.
export async function prepareVault(password: string) {
  const passes = await calibratePasses(crypto);
  return createVault(crypto, password, { memoryKiB: defaultMemoryKiB, passes, parallelism: 1 });
}

export async function persistVault(record: VaultRecord): Promise<void> {
  await saveVaultRecord(record);
}

export async function sessionFromPassword(record: VaultRecord, password: string) {
  return openSession(await unlockWithPassword(crypto, record, password), record);
}

// Olvidé la contraseña: la clave de recuperación desenvuelve la DEK y se fija una contraseña nueva.
export async function sessionFromRecovery(
  record: VaultRecord,
  recoveryKeyText: string,
  newPassword: string,
): Promise<Session> {
  const dek = unlockWithRecoveryKey(crypto, record, recoveryKeyText);
  const updated = await changePassword(crypto, record, dek, newPassword, costOf(record));
  await saveVaultRecord(updated);
  return openSession(dek, updated);
}

export async function changeMasterPassword(
  session: Session,
  currentPassword: string,
  newPassword: string,
): Promise<VaultRecord> {
  // Verifica la contraseña actual aunque la bóveda ya esté abierta.
  const check = await unlockWithPassword(crypto, session.record, currentPassword);
  wipe(check);
  const updated = await changePassword(
    crypto,
    session.record,
    session.dek,
    newPassword,
    costOf(session.record),
  );
  await saveVaultRecord(updated);
  return updated;
}
