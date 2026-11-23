import { preventScreenCaptureAsync } from 'expo-screen-capture';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { VaultRecord } from '@/crypto/vault';
import {
  disableBiometricUnlock,
  enableBiometricUnlock,
  isBiometricEnabled,
  loadBiometricDek,
  loadVaultRecord,
} from '@/crypto/vault-store';
import { wipeDecryptedCache } from '@/files/encrypted-store';
import { clearDecryptedImages } from '@/features/pages/decrypted-image-cache';
import { clearCopiedSecret } from '@/secrets/clipboard';
import { clearSyncContext } from '@/sync/sync-scheduler';

import { closeSession, openSession, type Session } from './vault-actions';

export type VaultState =
  | { status: 'loading' }
  | { status: 'setup' }
  | { status: 'locked'; record: VaultRecord; biometricEnabled: boolean; notice?: string }
  | { status: 'unlocked'; session: Session; biometricEnabled: boolean };

type VaultContextValue = {
  state: VaultState;
  unlock: (session: Session) => void;
  // Pide la huella y devuelve la sesión sin abrirla (la pantalla anima a Kipo y luego llama a unlock).
  biometricSession: () => Promise<Session | null>;
  // `notice` se muestra en la pantalla de bloqueo (por ejemplo, si falló abrir la base).
  lock: (notice?: string) => void;
  updateRecord: (record: VaultRecord) => void;
  setBiometric: (enabled: boolean) => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VaultState>({ status: 'loading' });

  useEffect(() => {
    // FLAG_SECURE en Android: sin capturas de pantalla y sin vista previa en apps recientes.
    preventScreenCaptureAsync().catch((e: unknown) =>
      console.warn('Sin protección de pantalla', e),
    );
    wipeDecryptedCache(); // por si la app se cerró sin bloquear
    (async () => {
      const record = await loadVaultRecord();
      if (!record) return setState({ status: 'setup' });
      setState({ status: 'locked', record, biometricEnabled: await isBiometricEnabled() });
    })().catch((e: unknown) => console.error('No se pudo leer la bóveda', e));
  }, []);

  const unlock = useCallback((session: Session) => {
    void isBiometricEnabled().then((biometricEnabled) =>
      setState({ status: 'unlocked', session, biometricEnabled }),
    );
  }, []);

  const lock = useCallback((notice?: string) => {
    clearSyncContext();
    void clearCopiedSecret(); // una clave copiada no queda en el portapapeles al bloquear
    clearDecryptedImages();
    wipeDecryptedCache();
    setState((current) => {
      if (current.status !== 'unlocked') return current;
      closeSession(current.session);
      return {
        status: 'locked',
        record: current.session.record,
        biometricEnabled: current.biometricEnabled,
        ...(notice ? { notice } : {}),
      };
    });
  }, []);

  const biometricSession = useCallback(async () => {
    if (state.status !== 'locked') return null;
    const dek = await loadBiometricDek();
    return dek ? openSession(dek, state.record) : null;
  }, [state]);

  const updateRecord = useCallback((record: VaultRecord) => {
    setState((current) =>
      current.status === 'unlocked'
        ? { ...current, session: { ...current.session, record } }
        : current,
    );
  }, []);

  const setBiometric = useCallback(
    async (enabled: boolean) => {
      if (state.status !== 'unlocked') return;
      if (enabled) await enableBiometricUnlock(state.session.dek);
      else await disableBiometricUnlock();
      setState({ ...state, biometricEnabled: enabled });
    },
    [state],
  );

  const value = useMemo(
    () => ({ state, unlock, biometricSession, lock, updateRecord, setBiometric }),
    [state, unlock, biometricSession, lock, updateRecord, setBiometric],
  );
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultContextValue {
  const value = useContext(VaultContext);
  if (!value) throw new Error('useVault debe usarse dentro de VaultProvider');
  return value;
}

// Para pantallas que solo existen con la bóveda abierta.
export function useSession(): Session {
  const { state } = useVault();
  if (state.status !== 'unlocked') throw new Error('La bóveda está bloqueada');
  return state.session;
}
