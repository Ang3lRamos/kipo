# Kipo — contexto del proyecto

App móvil personal (Expo / React Native + TypeScript) para guardar documentos, vencimientos, ubicación física de originales y, más adelante, contraseñas y notas seguras. Uso personal de un solo usuario (Angel). El plan por fases está en `PLAN.md`; trabaja siempre sobre la fase activa.

## Principios que no se negocian

1. **Zero-knowledge**: todo se cifra en el dispositivo antes de salir. Supabase y R2 solo reciben datos cifrados. Nunca enviar texto plano, OCR ni miniaturas sin cifrar a la nube.
2. **Local-first**: la fuente de verdad es la base local (SQLite + SQLCipher). La nube es respaldo y sincronización.
3. **No inventar criptografía**: usar solo primitivas estándar desde librerías auditadas (AES-256-GCM, Argon2id o scrypt, CSPRNG). Nunca reutilizar un nonce.
4. **La contraseña maestra nunca se guarda**, ni en disco, ni en logs, ni en la nube.
5. **Secretos fuera de la app**: las credenciales de R2 viven solo en los secrets de las Edge Functions. La app solo usa la URL y la anon key de Supabase.
6. **Orden del pipeline de archivos**: capturar → redimensionar/comprimir (WebP) → miniatura → cifrar → subir.

## Stack

- Expo SDK (development build, no Expo Go a partir de la fase 2), `expo-router`, TypeScript estricto
- `expo-sqlite` con SQLCipher + FTS5 para búsqueda
- `expo-secure-store`, `expo-local-authentication`, `expo-screen-capture`
- `expo-image-manipulator`, `expo-image-picker`, `expo-document-picker`, `react-native-document-scanner-plugin`
- `expo-notifications` (solo notificaciones locales)
- Cripto: `react-native-quick-crypto` (scrypt/AES-GCM nativo) o `@noble/ciphers` + `@noble/hashes`
- Nube: Supabase (Auth, Postgres con RLS, Edge Functions en Deno) + Cloudflare R2 (URLs prefirmadas S3)
- OCR: `@react-native-ml-kit/text-recognition` (en el dispositivo)

## Estructura

```
src/                 # alias @/* apunta aquí
  app/               # rutas de expo-router (pantallas); nada que no sea pantalla
  db/                # esquema SQLite, migraciones, repositorios
  crypto/            # derivación de claves, envoltura de la DEK, cifrar/descifrar
  files/             # captura, compresión, miniaturas, almacenamiento local
  sync/              # cliente Supabase, subida/bajada R2, cola de sincronización
  notifications/     # programación de alertas de vencimiento
  features/<x>/      # componentes y hooks por funcionalidad
  ui/                # componentes reutilizables
supabase/
  migrations/        # SQL de tablas y políticas RLS
  functions/         # Edge Functions (upload-url, download-url)
```

## Notas del entorno

- Red corporativa con inspección TLS: si el CLI de Expo falla con `self-signed certificate`, anteponer `NODE_OPTIONS=--use-system-ca` (usa los certificados de Windows; nunca desactivar la verificación TLS).
- Instalar paquetes con `npx expo install <paquete>` para obtener versiones compatibles con el SDK.

## Convenciones

- Archivos pequeños y con una sola responsabilidad. Si un archivo pasa de unas 200 líneas, divídelo.
- Nada de `any`. Tipos compartidos en `src/types`.
- Las funciones de `src/crypto` llevan pruebas unitarias (Jest): ida y vuelta, nonce único, rechazo de datos alterados.
- Cada cambio de esquema es una migración nueva; nunca se edita una migración ya aplicada.
- Commits pequeños por tarea. `.env` y llaves nunca entran a git.
- Comentarios y textos de la UI en español.

## Comandos

```
npx expo start                      # servidor de desarrollo
npx expo run:android | run:ios      # development build local
eas build --profile development     # dev build en la nube
npx jest                            # pruebas
npm run lint && npm run typecheck   # antes de cerrar cualquier tarea
supabase functions deploy <nombre>  # desplegar Edge Function
```
