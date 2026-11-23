# Plan — Kipo (Expo)

Cada fase termina con algo que funciona en tu celular. No avances de fase sin cumplir el **criterio de terminado**. El **prompt sugerido** es para pegarlo en Claude Code al iniciar la fase.

---

## Fase 0 — Preparación (1–2 días)

**Cuentas**: Expo (EAS), Supabase, Cloudflare (R2), GitHub.

**Tareas**

- [x] `npx create-expo-app@latest kipo --template default` (TypeScript + expo-router)
- [x] Copiar `CLAUDE.md` y `PLAN.md` a la raíz del repo
- [x] Crear la estructura de carpetas de `CLAUDE.md`
- [x] ESLint + Prettier + `tsconfig` estricto
- [x] Jest configurado con una prueba de ejemplo
- [x] `.gitignore` con `.env*`, llaves y builds
- [x] Repo privado en GitHub y primer commit

**Terminado cuando**: la app abre en tu celular con Expo Go y `npx jest` pasa.

> Prompt: "Lee CLAUDE.md y PLAN.md. Ejecuta la Fase 0: deja la estructura de carpetas, el TypeScript estricto, ESLint, Prettier y Jest listos. No agregues funcionalidades."

---

## Fase 1 — Documentos locales sin cifrado (1 semana)

El objetivo es aprender Expo y validar el modelo de datos antes de complicarlo.

**Modelo local (SQLite)**

```sql
documents(
  id TEXT PRIMARY KEY,          -- uuid
  title TEXT NOT NULL,
  category TEXT NOT NULL,       -- identidad, vehiculo, salud, finanzas, garantias, laboral, hogar, otro
  tags TEXT,                    -- JSON array
  physical_location TEXT,       -- "¿dónde está el original?"
  issued_at TEXT,
  expires_at TEXT,
  notes TEXT,
  ocr_text TEXT,
  file_path TEXT,
  thumb_path TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,              -- borrado lógico (necesario para sync)
  synced_at TEXT
)
documents_fts  -- tabla virtual FTS5 sobre title, tags, notes, physical_location, ocr_text
activity_log(id, document_id, action, created_at)  -- creado, editado, visto, compartido
```

**Pantallas**

- [x] Inicio: búsqueda arriba, filtros por categoría y lista con miniaturas
- [x] Detalle del documento: datos, ubicación física, historial de actividad
- [x] Crear/editar documento (formulario, todavía sin archivo)
- [x] "Por vencer": documentos que vencen en los próximos 60 días

**Terminado cuando**: creas 10 documentos de prueba y los encuentras por nombre, etiqueta o ubicación en menos de 2 segundos.

> Prompt: "Fase 1 de PLAN.md. Implementa el esquema con migraciones en src/db, repositorios tipados y las 4 pantallas. Usa FTS5 para la búsqueda. Sin cifrado todavía."

---

## Fase 2 — Captura y compresión (1 semana)

A partir de aquí se usa un **development build**, porque el escáner y la cripto nativa no funcionan en Expo Go.

- [x] Android: `eas build --profile development --platform android` → instalar el APK directo (gratis, sin Play Store)
- [ ] iPhone (elige una):
  - Con Mac: `npx expo run:ios --device` con Apple ID gratis (la app caduca a los 7 días; se reinstala)
  - Sin Mac: cuenta Apple Developer (USD 99/año) + `eas device:create` y `eas build --profile development --platform ios`
  - Sin ninguna: seguir probando en iPhone solo lo que corre en Expo Go y validar lo nativo en Android
- [x] Escanear documento con recorte automático (`react-native-document-scanner-plugin`)
- [x] Elegir de la galería o adjuntar PDF (`expo-document-picker`)
- [x] Pipeline en `src/files`: redimensionar a 1800 px de lado largo, WebP con calidad 0.75 y miniatura de 300 px
- [x] Verificar que se eliminan los EXIF/GPS
- [x] Varias páginas por documento (tabla `document_pages`)

**Terminado cuando**: una foto de 4 MB queda en menos de 500 KB y la cédula se lee bien al hacer zoom.

> Prompt: "Fase 2. Configura el development build e implementa src/files: captura, compresión WebP, miniatura y soporte multipágina. Agrega pruebas del pipeline."

---

## Fase 3 — Seguridad (1–2 semanas) ⚠️ la más importante

**Jerarquía de claves**

```
Contraseña maestra ──scrypt/Argon2id + salt──► KEK
DEK (aleatoria, 32 bytes) ── cifra todo (archivos + base SQLCipher)
DEK envuelta con la KEK       → se guarda en SecureStore y en la nube
DEK envuelta con la clave de recuperación → kit de recuperación impreso
SecureStore (protegido con biometría) → desbloqueo con huella o Face ID
```

Como todo se cifra con la DEK, cambiar la contraseña maestra solo vuelve a envolver la DEK; no hay que re-cifrar cada archivo.

**Tareas**

- [x] Onboarding: crear contraseña maestra (con medidor de fortaleza) y mostrar el kit de recuperación
- [x] `src/crypto`: derivar KEK, generar/envolver/desenvolver la DEK, `encryptFile` y `decryptFile` con AES-256-GCM y nonce aleatorio por archivo
- [x] Pruebas: ida y vuelta, nonce único, falla si se altera un byte, falla con contraseña incorrecta
- [x] Migrar SQLite a SQLCipher usando la DEK
- [x] Desbloqueo biométrico y, como respaldo, contraseña maestra
- [x] Bloqueo automático al pasar a segundo plano o tras N minutos
- [x] Ocultar el contenido en el selector de apps y bloquear capturas en pantallas sensibles (`expo-screen-capture`)
- [x] Los archivos descifrados solo viven en memoria o en la caché temporal, que se borra al bloquear
- [x] Cambiar la contraseña maestra

**Terminado cuando**: copias la carpeta de la app y la base de datos, y sin la contraseña no se puede leer nada.

> Prompt: "Fase 3. Implementa src/crypto con la jerarquía de claves de PLAN.md usando react-native-quick-crypto. Escribe primero las pruebas. Después integra el desbloqueo, el bloqueo automático y SQLCipher. Explícame cada decisión criptográfica."

---

## Fase 4 — Vencimientos (3–4 días)

- [x] Al guardar un documento con `expires_at`, programar notificaciones locales a 60, 30, 7 y 1 día
- [x] Reprogramar al editar y cancelar al borrar
- [x] El texto de la notificación no revela datos ("Tienes un documento por vencer"), porque se ve con el teléfono bloqueado
- [x] Ajustes: qué días avisar

**Terminado cuando**: un documento con vencimiento de prueba en 2 minutos dispara la notificación.

---

## Fase 5 — Nube: Supabase + R2 (1–2 semanas)

**Supabase (Postgres)**

```sql
create table vault_keys (
  user_id uuid primary key references auth.users,
  wrapped_dek text not null,     -- DEK envuelta con la KEK
  kdf_salt text not null,
  kdf_params jsonb not null,
  updated_at timestamptz default now()
);
create table documents (
  id uuid primary key,
  user_id uuid not null references auth.users,
  payload_enc text not null,     -- metadatos cifrados (JSON)
  file_key text,                 -- ruta en R2
  thumb_key text,
  updated_at timestamptz not null,
  deleted_at timestamptz
);
-- RLS: cada usuario solo ve y edita sus filas (user_id = auth.uid())
```

**Edge Functions**

- [x] `upload-url`: valida el JWT, arma la ruta `{user_id}/{doc_id}/{file|thumb|page-n}` y devuelve una URL PUT prefirmada que expira en 5 minutos
- [x] `download-url`: lo mismo para GET
- [x] Credenciales de R2 en `supabase secrets`, nunca en la app

**App**

- [x] Login con Supabase Auth (correo + contraseña, distinta de la maestra) y 2FA
- [x] Cola de sincronización en `src/sync`: subir pendientes y bajar cambios desde `synced_at`
- [x] Conflictos: gana el `updated_at` más reciente
- [x] Restaurar en un celular nuevo: login → bajar `vault_keys` → contraseña maestra → bajar documentos
- [x] Alerta de facturación en Cloudflare y revisión del uso en Supabase

**Terminado cuando**: borras la app, la reinstalas y recuperas todo con tu login y tu contraseña maestra. En R2 y Supabase solo se ven datos ilegibles.

> Prompt: "Fase 5. Crea las migraciones con RLS, las Edge Functions upload-url y download-url para R2 con @aws-sdk/s3-request-presigner, y src/sync con cola offline. Revisa que ningún dato salga sin cifrar."

---

## Fase 6 — OCR y búsqueda por contenido (1 semana)

- [ ] OCR en el dispositivo con ML Kit al guardar cada página
- [ ] Guardar el texto en `ocr_text`, indexado en FTS5 y viajando cifrado dentro de `payload_enc`
- [ ] Sugerir automáticamente título, categoría y fecha de vencimiento a partir del texto (con reglas simples al inicio)
- [ ] Resaltar las coincidencias en los resultados

**Terminado cuando**: buscas "Sura" y aparece un PDF que se llama `scan_0034`.

---

## Fase 7 — Contraseñas y notas seguras (opcional, 1–2 semanas)

Decide antes: ¿Bitwarden para las contraseñas, o construirlo tú?

- [ ] Tipos de ítem: login (usuario, contraseña, URL, TOTP), nota segura, tarjeta (solo los últimos 4 dígitos y el banco) y suscripción
- [ ] Generador de contraseñas
- [ ] Copiar al portapapeles con borrado automático a los 30 segundos
- [ ] Códigos TOTP (2FA)

---

## Fase 8 — Pulido y entrega (1 semana)

- [ ] Exportar un respaldo cifrado (`.kipo`) y probar a restaurarlo
- [ ] Compartir temporal: descifrar → enlace R2 de 24 horas con un archivo re-cifrado y una clave aparte (o solo exportar al compartir del sistema)
- [ ] Pantalla de ajustes: tiempo de bloqueo, biometría, alertas, almacenamiento usado
- [ ] Temas elegibles: paletas Menta, Lavanda, Durazno y Cielo, más modo oscuro (claro, oscuro o según el sistema). `src/ui/themes.ts` con los tokens de cada paleta, un `ThemeProvider` y la elección guardada en SecureStore (no en SQLite: la base está cifrada). El color de la mascota sigue al tema.
- [ ] Mascota Kipo: el SVG como componente con `react-native-svg` y animaciones con `react-native-reanimated` (flotar, parpadear, despertar al desbloquear)
- [ ] Ícono y splash
- [ ] `eas build --profile production`: APK o AAB en Android, TestFlight en iPhone
- [ ] Revisión de seguridad final con una checklist (ver abajo)

---

## Checklist de seguridad (antes de guardar documentos reales)

- [ ] Ningún `console.log` imprime claves, contraseñas ni contenido descifrado
- [ ] Nonces aleatorios y únicos; las pruebas de cripto pasan
- [ ] Las políticas RLS están probadas con un segundo usuario de prueba
- [ ] Las URLs prefirmadas expiran y solo permiten la ruta del usuario
- [ ] Ningún secreto en el repo (`git log -p | grep -i secret`)
- [ ] El kit de recuperación funciona (probado de verdad)
- [ ] Cerraste la app con un documento abierto y se bloqueó

## Riesgos conocidos

- **Olvidar la contraseña maestra sin el kit de recuperación** = pérdida total. Es el precio del zero-knowledge.
- **Proyecto de Supabase pausado** por una semana sin uso: la app sigue funcionando local; solo hay que reactivarlo en el panel.
- **Argon2id en JS puro es lento en el celular**: por eso se usa scrypt nativo de `react-native-quick-crypto`. Se mide el tiempo y se ajustan los parámetros para que tarde entre 0.5 y 1 segundo.
