// Handler común de upload-url y download-url (Deno, Supabase Edge Functions).
// Las credenciales de R2 viven solo en los secrets de Supabase; la app nunca las ve.
import { GetObjectCommand, PutObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3@3.1175.0';
import { getSignedUrl } from 'npm:@aws-sdk/s3-request-presigner@3.1175.0';
import { createClient } from 'jsr:@supabase/supabase-js@2.119.2';

import { objectKey, parseObjectRequest, presignedTtlSeconds } from './object-key.ts';

type Operation = 'put' | 'get';

// Error con un mensaje seguro para devolver al teléfono (nunca incluye valores de secrets).
class SetupError extends Error {}

function env(...names: string[]): string {
  for (const name of names) {
    const value = Deno.env.get(name);
    if (value) return value;
  }
  throw new SetupError(`Falta el secret ${names.join(' o ')}`);
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Se crea al llegar la primera solicitud: si falta un secret, se responde con el motivo en
// lugar de que la función se caiga al cargar.
let r2: S3Client | null = null;
function r2Client(): S3Client {
  r2 ??= new S3Client({
    region: 'auto',
    endpoint: `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env('R2_ACCESS_KEY_ID'),
      secretAccessKey: env('R2_SECRET_ACCESS_KEY'),
    },
  });
  return r2;
}

// Verifica el JWT y exige segundo factor (aal2), igual que las políticas RLS.
async function authenticatedUser(request: Request): Promise<string | null> {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  // Proyectos con llaves nuevas pueden no definir SUPABASE_ANON_KEY: se prueban alternativas.
  const publicKey = env('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'KIPO_PUBLISHABLE_KEY');
  const supabase = createClient(env('SUPABASE_URL'), publicKey);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data) return null;
  const { sub, aal } = data.claims;
  return typeof sub === 'string' && aal === 'aal2' ? sub : null;
}

export function presignHandler(operation: Operation) {
  return async (request: Request): Promise<Response> => {
    try {
      if (request.method !== 'POST') return json(405, { error: 'Usa POST' });
      const userId = await authenticatedUser(request);
      if (!userId) return json(401, { error: 'Sesión inválida o sin segundo factor' });

      const target = parseObjectRequest(await request.json().catch(() => null));
      if (!target) return json(400, { error: 'Solicitud inválida' });

      const Key = objectKey(userId, target);
      const Bucket = env('R2_BUCKET');
      const command =
        operation === 'put'
          ? new PutObjectCommand({ Bucket, Key, ContentType: 'application/octet-stream' })
          : new GetObjectCommand({ Bucket, Key });
      const url = await getSignedUrl(r2Client(), command, { expiresIn: presignedTtlSeconds });
      return json(200, { url, expiresIn: presignedTtlSeconds });
    } catch (error) {
      console.error('presign falló', error);
      const message = error instanceof SetupError ? error.message : 'Error interno de la función';
      return json(500, { error: message });
    }
  };
}
