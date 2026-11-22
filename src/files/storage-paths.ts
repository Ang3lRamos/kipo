// Rutas relativas a la carpeta de documentos de la app. Se guardan relativas porque en iOS
// la ruta absoluta del contenedor cambia entre instalaciones y actualizaciones.
// Desde la fase 3 todos los archivos están cifrados (.bin); el tipo real va en la base.

const safeSegment = /^[A-Za-z0-9-]+$/;
const thumbPattern = /^docs\/[A-Za-z0-9-]+\/([A-Za-z0-9-]+)-thumb\.bin$/;

function assertSafe(segment: string): string {
  if (!safeSegment.test(segment)) throw new Error(`Segmento de ruta inválido: ${segment}`);
  return segment;
}

export function documentDir(documentId: string): string {
  return `docs/${assertSafe(documentId)}`;
}

export function pageFilePath(documentId: string, pageId: string): string {
  return `${documentDir(documentId)}/${assertSafe(pageId)}.bin`;
}

export function pageThumbPath(documentId: string, pageId: string): string {
  return `${documentDir(documentId)}/${assertSafe(pageId)}-thumb.bin`;
}

// La portada del documento guarda la ruta de la miniatura; de ahí se saca la página
// para reconstruir la AAD al descifrar.
export function pageIdFromThumbPath(path: string): string | null {
  return thumbPattern.exec(path)?.[1] ?? null;
}

export function isEncryptedPath(path: string): boolean {
  return path.endsWith('.bin');
}
