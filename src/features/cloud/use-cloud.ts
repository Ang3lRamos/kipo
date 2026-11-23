import { useCallback, useEffect, useState } from 'react';

import { cloudStatus, type CloudStatus } from '@/sync/cloud-auth';
import { getSyncState, subscribeSync, type SyncState } from '@/sync/sync-scheduler';

// Estado de la cuenta en la nube + estado de la sincronización, para las pantallas.
export function useCloud() {
  const [status, setStatus] = useState<CloudStatus | null>(null);
  const [sync, setSync] = useState<SyncState>(getSyncState);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await cloudStatus());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar la cuenta');
      setStatus({ kind: 'signed-out' });
    }
  }, []);

  useEffect(() => {
    let active = true;
    cloudStatus()
      .then((next) => active && setStatus(next))
      .catch(() => active && setStatus({ kind: 'signed-out' }));
    const unsubscribe = subscribeSync(setSync);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Ejecuta una acción de la cuenta y vuelve a leer el estado; devuelve el error en español.
  const run = useCallback(
    async (action: () => Promise<void>) => {
      setError(null);
      try {
        await action();
        await refresh();
        return true;
      } catch (e) {
        setError(translateAuthError(e));
        return false;
      }
    },
    [refresh],
  );

  return { status, sync, error, setError, refresh, run };
}

function translateAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(message))
    return 'Confirma tu correo con el enlace que te enviamos.';
  if (/already registered/i.test(message)) return 'Ese correo ya tiene una cuenta: inicia sesión.';
  if (/invalid totp|invalid code|expired/i.test(message)) return 'Código incorrecto o vencido.';
  if (/password should be/i.test(message))
    return 'La contraseña es muy corta (mínimo 8 caracteres).';
  if (/network|fetch/i.test(message)) return 'Sin conexión. Revisa tu internet.';
  return message;
}
