# Criptografía de Kipo

Este documento explica cada decisión criptográfica de la fase 3 y por qué. Si cambias algo en `src/crypto`, actualízalo aquí.

## Jerarquía de claves

```
Contraseña maestra ──Argon2id + sal──► KEK (32 bytes)
                                          │ envuelve (AES-256-GCM)
                                          ▼
DEK (32 bytes aleatorios) ◄── envuelve ── Clave de recuperación ──HKDF──► llave de recuperación
   │
   ├─HKDF "kipo/sqlcipher/v1"─► llave de la base (SQLCipher)
   ├─HKDF "kipo/files/v1"─────► llave de archivos (AES-256-GCM)
   └─HKDF "kipo/metadata/v1"──► llave de metadatos para la nube (AES-256-GCM)

SecureStore (Keystore de Android)
   ├─ registro de la bóveda: sal, parámetros de Argon2, DEK envuelta ×2  (no sirve sin la contraseña)
   └─ DEK protegida con huella (opcional; Android la invalida si cambian las huellas)
```

**Por qué una DEK separada de la contraseña:** todo se cifra con la DEK, que es aleatoria y nunca cambia. Cambiar la contraseña solo vuelve a envolver la DEK (32 bytes); no hay que re-cifrar cada archivo. También permite tener dos "llaves de entrada" (contraseña y clave de recuperación) para la misma bóveda.

## Decisiones

| Tema | Decisión | Motivo |
|---|---|---|
| Derivar la KEK | **Argon2id**, 64 MiB, p = 1, pasadas calibradas (2–10) para tardar ~0,75 s en el teléfono | Ganador de la Password Hashing Competition y primera recomendación de OWASP. Consume memoria por intento, lo que encarece los ataques con GPU. El plan permitía scrypt; Argon2id es mejor y `react-native-quick-crypto` lo trae nativo. |
| Sal | 16 bytes aleatorios por bóveda, nueva en cada cambio de contraseña | Evita tablas precalculadas y que dos bóvedas con la misma contraseña tengan la misma KEK. |
| Normalización | La contraseña se pasa a **NFKC** antes de derivar | "é" puede escribirse como 1 o 2 caracteres Unicode según el teclado; sin normalizar, la misma contraseña fallaría en otro teléfono. |
| Cifrado | **AES-256-GCM** (OpenSSL nativo) | Cifrado autenticado estándar: confidencialidad e integridad en una sola operación. Si se altera un solo byte, el descifrado falla. |
| Nonce | 12 bytes **aleatorios** por cada cifrado, guardados junto al dato | Nunca se reutiliza un nonce con la misma llave (las pruebas lo verifican). Con nonces aleatorios el límite seguro es ~2³² cifrados por llave, muy por encima del uso de una persona. |
| Formato | `[versión 1 byte][nonce 12][cifrado][etiqueta 16]` | El byte de versión permite cambiar el algoritmo en el futuro sin romper datos viejos. |
| AAD (contexto) | Cada cifrado lleva un contexto autenticado: `kipo/file/v1/thumb/<página>`, `kipo/dek-wrap/password/v1`, etc. | Liga cada dato a su uso: no se puede cambiar la miniatura de un documento por la página de otro, ni usar la DEK envuelta para otra cosa. |
| Subllaves | **HKDF-SHA256** desde la DEK, una por uso (base, archivos, metadatos de la nube) | Separación de dominios: la llave que ve SQLCipher no es la misma que cifra archivos. |
| Base de datos | **SQLCipher** con llave cruda `x'…'` | La llave ya viene de HKDF; con llave cruda SQLCipher no aplica su propio PBKDF2 (que sería trabajo inútil). Cifra la base completa, incluido el índice de búsqueda FTS5. |
| Clave de recuperación | 160 bits aleatorios + 16 bits de verificación, en base32 de Crockford (9 grupos de 4) | 160 bits no se pueden adivinar, así que no necesita Argon2: basta HKDF. Crockford evita letras confundibles (O/0, I/1/L), y la suma de verificación detecta errores al copiarla a mano. |
| Huella | La DEK se guarda en SecureStore con `requireAuthentication` | El Keystore de Android solo la entrega tras autenticar con biometría, e invalida la llave si se registran huellas nuevas. Si falla, se usa la contraseña. |
| Almacenamiento seguro | `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, `allowBackup: false` | Las llaves no salen del teléfono en respaldos de Google ni se restauran en otro dispositivo. |
| Primitivas | `react-native-quick-crypto` (OpenSSL) para aleatorios, Argon2id y AES-GCM; `@noble/hashes` para HKDF y SHA-256; `@scure/base` para base64/base32 | Solo librerías auditadas; no hay criptografía propia. quick-crypto replica la API de Node, así que las pruebas de Jest corren **el mismo código** sobre `node:crypto`. |

## Nube (fase 5)

- Cada documento sube como un solo bloque `payload_enc` = AES-256-GCM(llave de metadatos, JSON) con AAD `kipo/doc/v1/<id>`: no se puede pegar el contenido de un documento en la fila de otro.
- Los archivos suben tal cual están en el teléfono (ya cifrados con la llave de archivos y su AAD de página).
- `vault_keys` guarda el mismo registro que SecureStore: inútil sin la contraseña o la clave de recuperación.
- La cuenta de Supabase (correo, contraseña y TOTP) solo da acceso a datos cifrados; su contraseña es distinta de la maestra.
- La sesión de Supabase vive en SecureStore. Las credenciales de R2 viven solo en los secrets de las Edge Functions.
- Detalles y configuración en `docs/nube.md`.

## OCR (fase 6)

- El texto se reconoce en el teléfono (ML Kit en Android, Vision en iOS) sobre la imagen ya comprimida y sin metadatos, **antes** de cifrarla. Ninguna imagen ni texto sale a un servicio de OCR.
- Para leer PDFs y documentos guardados antes, la página se descifra a `cache/decrypted/`, se lee y el temporal se borra de inmediato (y la carpeta se vacía al bloquear).
- El texto se guarda por página en SQLCipher y viaja a la nube dentro de `payload_enc`, cifrado con la llave de metadatos.

## Qué protege y qué no

**Protege:** si alguien copia la carpeta de la app, la base o los archivos (respaldo, teléfono robado sin desbloquear la app, la nube en la fase 5), no puede leer nada sin la contraseña o la clave de recuperación. Para adivinar la contraseña tendría que pagar ~0,75 s y 64 MiB por intento.

**No protege (límites conocidos):**
- Un teléfono con malware o root mientras Kipo está desbloqueado: las llaves están en memoria.
- En JavaScript no se puede garantizar que una llave se borre de la memoria (el recolector puede copiarla). Se sobrescriben los `Uint8Array` con ceros al bloquear, pero algunos textos (por ejemplo la llave en hexadecimal que recibe SQLCipher) son inmutables.
- Una contraseña maestra débil. Por eso el medidor exige una puntuación mínima.
- Olvidar la contraseña **y** perder la clave de recuperación: es pérdida total. Es el precio del zero-knowledge.

## Bloqueo

- Al pasar a segundo plano y tras 5 minutos sin tocar la pantalla, se borran las llaves de la memoria, se cierra la base y se vacían las imágenes descifradas y la carpeta temporal de PDF.
- El escáner, la galería, el selector de archivos y el visor de PDF suspenden el bloqueo mientras se usan, con un tope de 10 minutos.
- `FLAG_SECURE` (expo-screen-capture) impide capturas de pantalla y oculta la app en el selector de apps recientes.
- Las imágenes descifradas solo existen en memoria (data URI, `cachePolicy="none"`). Los PDF necesitan un archivo para el visor del sistema: van a `cache/decrypted/` y se borran al bloquear y al abrir la app.

## Pruebas (`npx jest src/crypto`)

Ida y vuelta, nonce único en 2.000 cifrados, rechazo de cualquier byte alterado o truncado, llave o contexto incorrectos, contraseña incorrecta, clave de recuperación de otra bóveda o con un error de digitación, cambio de contraseña (la DEK se conserva y la contraseña vieja deja de servir) y que el registro guardado no contiene la DEK ni la contraseña.
