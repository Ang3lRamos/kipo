// La app se bloquea al pasar a segundo plano. Pero el escáner, la galería, el selector de
// archivos y el visor de PDF son otras pantallas del sistema: abrirlas manda Kipo a segundo
// plano. Mientras dura uno de esos flujos se suspende el bloqueo, con un tope de tiempo.

const maxSuspensionMs = 10 * 60 * 1000;
let suspendedUntil = 0;

export function suspendAutoLock(): void {
  suspendedUntil = Date.now() + maxSuspensionMs;
}

export function resumeAutoLock(): void {
  suspendedUntil = 0;
}

export function isAutoLockSuspended(): boolean {
  return Date.now() < suspendedUntil;
}

export async function withAutoLockSuspended<T>(flow: () => Promise<T>): Promise<T> {
  suspendAutoLock();
  try {
    return await flow();
  } finally {
    resumeAutoLock();
  }
}
