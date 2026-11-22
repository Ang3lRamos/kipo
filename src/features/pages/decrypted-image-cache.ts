// Caché en memoria de imágenes descifradas (data URI). Nunca toca el disco y se vacía al bloquear.

const maxEntries = 80;
const cache = new Map<string, string>();

export function getDecryptedImage(key: string): string | undefined {
  return cache.get(key);
}

export function putDecryptedImage(key: string, dataUri: string): void {
  if (cache.size >= maxEntries) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, dataUri);
}

export function clearDecryptedImages(): void {
  cache.clear();
}
