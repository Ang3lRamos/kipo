import { useEffect, useState } from 'react';

import type { FileKind } from '@/crypto/file-crypto';
import { decryptToDataUri } from '@/files/encrypted-store';
import { useSession } from '@/features/lock/vault-context';

import { getDecryptedImage, putDecryptedImage } from './decrypted-image-cache';

type Loaded = { key: string; uri: string };

// Descifra una imagen guardada y devuelve un data URI (o null mientras carga o si falla).
// Las miniaturas se guardan en la caché de memoria; las páginas completas no.
export function useDecryptedImage(
  path: string | null,
  pageId: string | null,
  kind: Extract<FileKind, 'page' | 'thumb'>,
): string | null {
  const { keys } = useSession();
  const cacheKey = path && pageId ? `${kind}:${pageId}` : null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const cached = cacheKey ? getDecryptedImage(cacheKey) : undefined;

  useEffect(() => {
    if (!path || !pageId || !cacheKey || getDecryptedImage(cacheKey)) return;
    let active = true;
    decryptToDataUri(keys.fileKey, path, pageId, kind)
      .then((uri) => {
        if (kind === 'thumb') putDecryptedImage(cacheKey, uri);
        if (active) setLoaded({ key: cacheKey, uri });
      })
      .catch((error: unknown) => console.error('No se pudo descifrar la imagen', error));
    return () => {
      active = false;
    };
  }, [path, pageId, kind, cacheKey, keys.fileKey]);

  if (!cacheKey) return null;
  if (cached) return cached;
  return loaded?.key === cacheKey ? loaded.uri : null;
}
