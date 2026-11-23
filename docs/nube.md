# Respaldo en la nube (fase 5)

## Qué se guarda y dónde

| Dónde | Qué | ¿Puede leerlo el servidor? |
|---|---|---|
| Supabase `vault_keys` | DEK envuelta con la contraseña maestra y con la clave de recuperación, sal y parámetros de Argon2 | No: sin la contraseña o la clave de recuperación no sirve |
| Supabase `documents` | `payload_enc`: título, categoría, etiquetas, ubicación, fechas, notas, OCR y lista de páginas, cifrado con AES-256-GCM | No. Solo ve el id, las fechas de cambio y si está borrado |
| Cloudflare R2 | Los `.bin` de cada página y miniatura, tal cual están en el teléfono (ya cifrados) | No |

Ruta en R2: `{user_id}/{document_id}/{page_id}/{page|thumb}`. La arma la Edge Function a partir del JWT; el teléfono nunca la elige.

## Cómo sincroniza

1. **Bóveda:** si la nube no la tiene, o si cambiaste la contraseña en este teléfono, se sube. **Nunca** se reemplaza la local con la de la nube (eso solo pasa al restaurar en un teléfono nuevo), así un servidor comprometido no puede cambiarte las llaves.
2. **Bajar:** cambios desde el cursor `(server_updated_at, id)`, que pone el servidor (no depende del reloj del teléfono). Si el documento de la nube es más nuevo que el local, se aplica: primero se bajan sus archivos y luego se escribe todo en una transacción.
3. **Subir:** cada documento con `updated_at > synced_at` (la cola offline). Primero los archivos de páginas nuevas y luego los metadatos, con `kipo_upsert_document`, que aplica la regla "gana el `updated_at` más reciente" en un solo paso.
4. Corre al desbloquear, 3 segundos después de cada cambio y con "Sincronizar ahora". Nunca dos a la vez. Sin red, lo pendiente queda en la cola y se reintenta.

**Límite conocido:** al borrar un documento o una página, sus archivos quedan en R2 (no hay una función para borrarlos todavía). No se pueden leer, pero ocupan espacio.

## Configuración (una sola vez)

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratis alcanza).
2. **Authentication → Sign In / Providers → Email**: activado. **Authentication → Multi-Factor**: TOTP activado (viene así por defecto).
3. **SQL Editor**: pega y ejecuta, en orden, cada archivo de `supabase/migrations/` (vault_and_documents, grants y secrets).
   - O con la CLI: `npx supabase link --project-ref <ref>` y `npx supabase db push`.
4. **Project Settings → API**: copia la *Project URL* y la *anon public key*.

### 2. Cloudflare R2

1. En [dash.cloudflare.com](https://dash.cloudflare.com) → **R2** → crea un bucket (por ejemplo, `kipo`). No lo hagas público.
2. **R2 → Manage R2 API Tokens → Create API token** con permiso *Object Read & Write* solo para ese bucket. Guarda el *Access Key ID* y el *Secret Access Key*.
3. Anota tu *Account ID* (aparece en la página de R2).
4. **Billing → Notifications**: crea una alerta de facturación (PLAN.md).

### 3. Edge Functions

Las credenciales de R2 van **solo** a los secrets de Supabase, nunca a la app ni a git:

```
npx supabase login
npx supabase link --project-ref <ref>
npx supabase secrets set R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=kipo
npx supabase functions deploy upload-url
npx supabase functions deploy download-url
```

### 4. La app

Crea `.env` en la raíz (está en `.gitignore`) con los dos valores públicos:

```
EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Reinicia Expo (`npx expo start --dev-client --tunnel`): las variables se leen al arrancar.

## Comprobar

- **Ajustes → Respaldo en la nube**: crea la cuenta, confirma el correo, inicia sesión y activa el segundo factor con tu app de autenticación.
- En Supabase, la tabla `documents` solo debe mostrar `payload_enc` ilegible; en R2, archivos binarios.
- **Criterio de la fase:** borra la app, reinstálala, elige "Ya uso Kipo: restaurar desde la nube", entra con tu cuenta y tu contraseña maestra, y verifica que vuelve todo.
- **RLS con un segundo usuario** (checklist de seguridad): crea otra cuenta con su segundo factor y confirma que no ve nada del primero.
