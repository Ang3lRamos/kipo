import type { OpenedBackup } from './import-backup';

// Teléfono nuevo: el respaldo se elige y se valida la contraseña con la bóveda cerrada, pero
// la base cifrada solo existe después de desbloquear. Aquí espera hasta entonces (en memoria:
// si la app se cierra antes, solo hay que volver a elegir el archivo).
type Pending = { uri: string; opened: OpenedBackup };
let pending: Pending | null = null;

export function setPendingImport(next: Pending): void {
  pending = next;
}

export function takePendingImport(): Pending | null {
  const value = pending;
  pending = null;
  return value;
}

export function hasPendingImport(): boolean {
  return pending !== null;
}
