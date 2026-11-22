// Rutas relativas a la carpeta de documentos de la app. Se guardan relativas porque en iOS
// la ruta absoluta del contenedor cambia entre instalaciones y actualizaciones.

const safeSegment = /^[A-Za-z0-9-]+$/;

function assertSafe(segment: string): string {
  if (!safeSegment.test(segment)) throw new Error(`Segmento de ruta inválido: ${segment}`);
  return segment;
}

export function documentDir(documentId: string): string {
  return `docs/${assertSafe(documentId)}`;
}

export function pageFilePath(documentId: string, pageId: string, extension: 'webp' | 'pdf') {
  return `${documentDir(documentId)}/${assertSafe(pageId)}.${extension}`;
}

export function pageThumbPath(documentId: string, pageId: string): string {
  return `${documentDir(documentId)}/${assertSafe(pageId)}-thumb.webp`;
}
