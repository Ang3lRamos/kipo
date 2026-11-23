// Ruta de un archivo en R2. La arma siempre el servidor a partir del usuario del JWT:
// el teléfono solo dice qué documento y página quiere, nunca la ruta completa.
// Sin dependencias para poder usarlo en Deno (Edge Functions) y probarlo con Jest.

export type ObjectKind = 'page' | 'thumb';

export type ObjectRequest = { documentId: string; pageId: string; kind: ObjectKind };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseObjectRequest(body: unknown): ObjectRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { documentId, pageId, kind } = body as Record<string, unknown>;
  if (typeof documentId !== 'string' || !uuidPattern.test(documentId)) return null;
  if (typeof pageId !== 'string' || !uuidPattern.test(pageId)) return null;
  if (kind !== 'page' && kind !== 'thumb') return null;
  return { documentId: documentId.toLowerCase(), pageId: pageId.toLowerCase(), kind };
}

export function objectKey(userId: string, request: ObjectRequest): string {
  if (!uuidPattern.test(userId)) throw new Error('userId inválido');
  return `${userId.toLowerCase()}/${request.documentId}/${request.pageId}/${request.kind}`;
}

// Las URLs prefirmadas expiran en 5 minutos (PLAN.md).
export const presignedTtlSeconds = 300;
