import * as SecureStore from 'expo-secure-store';

import { fromBase64, toBase64 } from './bytes';
import { parseVaultRecord, serializeVaultRecord, type VaultRecord } from './vault';

// Dónde viven las llaves en el teléfono (Keystore de Android / Keychain de iOS):
// - El registro de la bóveda (DEK envuelta + parámetros de Argon2). No sirve sin la contraseña.
// - Una copia de la DEK protegida con biometría, solo si el usuario activa la huella.
// Nada de esto se respalda ni se copia a otro dispositivo (THIS_DEVICE_ONLY).

const recordKey = 'kipo.vault.v1';
const biometricDekKey = 'kipo.dek.biometric.v1';
const biometricFlagKey = 'kipo.biometric.enabled.v1';

const baseOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const biometricOptions: SecureStore.SecureStoreOptions = {
  ...baseOptions,
  requireAuthentication: true,
  authenticationPrompt: 'Desbloquear Kipo',
};

export async function loadVaultRecord(): Promise<VaultRecord | null> {
  const json = await SecureStore.getItemAsync(recordKey, baseOptions);
  return json ? parseVaultRecord(json) : null;
}

export async function saveVaultRecord(record: VaultRecord): Promise<void> {
  await SecureStore.setItemAsync(recordKey, serializeVaultRecord(record), baseOptions);
}

export function canUseBiometrics(): boolean {
  return SecureStore.canUseBiometricAuthentication();
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(biometricFlagKey, baseOptions)) === '1';
}

export async function enableBiometricUnlock(dek: Uint8Array): Promise<void> {
  await SecureStore.setItemAsync(biometricDekKey, toBase64(dek), biometricOptions);
  await SecureStore.setItemAsync(biometricFlagKey, '1', baseOptions);
}

export async function disableBiometricUnlock(): Promise<void> {
  await SecureStore.deleteItemAsync(biometricDekKey, biometricOptions);
  await SecureStore.deleteItemAsync(biometricFlagKey, baseOptions);
}

// Muestra el aviso de huella. Devuelve null si el usuario cancela o si la biometría cambió
// (Android invalida la llave al registrar una huella nueva): entonces se usa la contraseña.
export async function loadBiometricDek(): Promise<Uint8Array | null> {
  try {
    const value = await SecureStore.getItemAsync(biometricDekKey, biometricOptions);
    return value ? fromBase64(value) : null;
  } catch (error) {
    console.warn('Desbloqueo biométrico no disponible', error);
    return null;
  }
}
