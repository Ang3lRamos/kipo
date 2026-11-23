import { getStringAsync, setStringAsync } from 'expo-clipboard';

// Copiar una clave: se marca como sensible (Android 13+ no muestra la vista previa) y se borra
// del portapapeles a los 30 segundos o al bloquear Kipo, solo si sigue siendo lo que Kipo
// copió (no borra algo que el usuario haya copiado después).

export const clearAfterMs = 30_000;
let copied: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export async function clearCopiedSecret(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  const ours = copied;
  copied = null;
  if (!ours) return;
  try {
    if ((await getStringAsync()) === ours) await setStringAsync('');
  } catch (error) {
    console.warn('No se pudo limpiar el portapapeles', error);
  }
}

export async function copySecret(value: string): Promise<void> {
  if (timer) clearTimeout(timer);
  await setStringAsync(value, { android: { isSensitive: true } });
  copied = value;
  timer = setTimeout(() => void clearCopiedSecret(), clearAfterMs);
}
