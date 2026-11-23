// Handler común de upload-url y download-url (Deno, Supabase Edge Functions).
// Las credenciales de R2 viven solo en los secrets de Supabase; la app nunca las ve.
import { GetObjectCommand, PutObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3@3.1175.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1175.0';
import { createClient } from 'jsr:@supabase/supabase-js@2.119.2';

import { objectKey, parseObjectRequest, presignedTtlSeconds } from './object-key.ts';

type Operation = 'put' | 'get';

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta el secret ${name}`);
  return value;
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env('R2_ACCESS_KEY_ID'),
    secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
  },
});
const bucket = env('R2_BUCKET');

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Verifica el JWT y exige segundo factor (aal2), igual que las políticas RLS.
async function authenticatedUser(request: Request): Promise<string | null> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'));
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data) return null;
  const { sub, aal } = data.claims;
  return typeof sub === 'string' && aal === 'aal2' ? sub : null;
}

export function presignHandler(operation: Operation) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return json(405, { error: 'Usa POST' });
    const userId = await authenticatedUser(request);
    if (!userId) return json(401, { error: 'Sesión inválida o sin segundo factor' });

    const target = parseObjectRequest(await request.json().catch(() => null));
    if (!target) return json(400, { error: 'Solicitud inválida' });

    const Key = objectKey(userId, target);
    const command =
      operation === 'put'
        ? new PutObjectCommand({ Bucket: bucket, Key, ContentType: 'application/octet-stream' })
        : new GetObjectCommand({ Bucket: bucket, Key });
    const url = await getSignedUrl(r2, command, { expiresIn: presignedTtlSeconds });
    return json(200, { url, expiresIn: presignedTtlSeconds });
  };
}
