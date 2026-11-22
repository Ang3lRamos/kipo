# Kipo — guía de diseño

Fuente visual: mockup "Kipo — mockup de la app" en claude.ai. Los colores, radios, tipografías y sombras están en `src/ui/themes.ts`: **nunca escribas un color en una pantalla**, siempre `theme.colors.*`.

## Estilo general

- Limpio, claro y en tonos pastel. Las tarjetas son blancas con sombra suave (`tokens.shadow.card`), sin bordes.
- Las esquinas son redondeadas: 14 para inputs, 18 para botones y 20–24 para tarjetas.
- Los títulos van en Space Grotesk Bold y el texto en Inter (con `@expo-google-fonts/space-grotesk` y `@expo-google-fonts/inter`).
- Cada categoría tiene su color pastel (`theme.colors.categories`).
- Íconos de trazo (`lucide-react-native`), con grosor 2. Nunca emojis.
- Las zonas táctiles miden al menos 44 px. Los inputs llevan texto de 16 px para que iOS no haga zoom.

## Temas

- 4 paletas (Menta, Lavanda, Durazno y Cielo) × modo claro u oscuro. Además hay una opción "Según el sistema".
- `ThemeProvider` en `src/ui/theme-provider.tsx`, con los hooks `useTheme()` y `useThemePreference()`. Texto con `AppText` (`src/ui/text.tsx`).
- La elección se guarda en SecureStore (`src/ui/theme-preference.ts`), **no** en SQLite: la base está cifrada y la pantalla de bloqueo ya necesita el tema. Se lee de forma síncrona y se aplica antes de ocultar el splash.
- La mascota toma sus colores de `theme.mascot`.

## Mascota Kipo

- Es un cuerpo con forma de huevo, una argolla dorada de llavero en la cabeza y una cerradura en la barriga. La referencia está en `assets/kipo-mascota.svg`.
- Se implementa en `src/ui/kipo/` con `react-native-svg`. `<Kipo mood size colors? animated? bounceKey? />`: `mood` es `feliz | buscando | dormido | guino`, los colores salen del tema y `bounceKey` dispara el salto de despertar.
- Se dibuja en capas con el mismo viewBox (sombra, argolla, cuerpo y ojos), y cada capa se anima con su propio `Animated.View` y `transformOrigin`.
- Los desenfoques del SVG original (`feGaussianBlur`) se reemplazaron por degradados radiales: en Android los filtros no son confiables.
- Por debajo de 48 px se usa una versión simple, sin brillos ni mejillas.
- Es decorativa: queda oculta para el lector de pantalla.
- Cuándo se usa cada expresión:
  - **dormido**: pantalla bloqueada.
  - **feliz**: inicio y estados vacíos.
  - **buscando**: OCR y búsquedas sin resultados.
  - **guino**: documento guardado.
- Las animaciones se hacen con `react-native-reanimated` y deben respetar "Reducir movimiento" (`useReducedMotion`):

| Animación | Detalle |
|---|---|
| Flotar | Sube 6 px y vuelve en 3 s, con ease-in-out y en bucle. La sombra se encoge al subir. Dormido: 2 px en 4.5 s. |
| Argolla | Se balancea entre −10° y 10° en 2.6 s, con el eje en (100, 48) del viewBox. |
| Parpadeo | Cada 4 s los ojos se cierran durante unos 0.2 s. |
| Buscando | Los ojos se mueven de −4 a 5 px de lado a lado en 3.2 s. |
| zzz | Suben 16 px y se desvanecen en 3 s, con dos letras desfasadas 1.5 s. |
| Despertar | Al desbloquear, cambia de dormido a feliz con un pequeño salto (escala 1 → 1.08 → 1, 300 ms) y una vibración leve (`expo-haptics`). |

## Pantallas

1. **Desbloquear**: fondo `location.bg` (lavanda). Arriba el logo "kipo", debajo Kipo dormido de 180 px, el saludo y un botón circular blanco de 112 px con el ícono de huella. Al tocarlo, Kipo se despierta y la app entra al inicio. Más abajo, el enlace "Usar contraseña maestra" y la nota "Cifrado en tu teléfono".
2. **Inicio**: logo y avatar. Kipo feliz de 64 px junto a "¿Qué buscamos hoy?". Después, la barra de búsqueda (52 px de alto, radio 18), los filtros de categoría en fila con scroll horizontal, la sección "Por vencer" (2 tarjetas en durazno o mantequilla según la urgencia) y "Recientes" (tarjetas con miniatura de color, título y ubicación física). Botón flotante "Escanear" y barra inferior con Inicio, Por vencer, Claves y Ajustes (la pestaña activa con fondo pastel).
3. **Detalle del documento**: barra superior con volver y opciones (⋯). Vista previa en un carrusel de páginas dentro de un recuadro pastel. Debajo, la categoría, el título, el vencimiento y las páginas. La tarjeta destacada **"¿Dónde está el original?"** (`location`), las etiquetas y el historial. Abajo, los botones Editar y Compartir 24 h.
4. **Nuevo documento**: miniaturas de páginas con "+" para agregar más. Un banner de sugerencia del OCR con Kipo buscando y el botón "Usar". Formulario con título, categoría (chips de colores), vence, etiquetas, "¿Dónde guardas el original?" y la casilla de alertas. Al final, el botón "Guardar cifrado".
5. **Elige tu color**: Kipo guiñando, 4 botones de paleta, el interruptor de modo oscuro, una vista previa en vivo y el botón "Listo". Aparece al final de la configuración inicial y también en Ajustes.

## Agregados a los tokens

- `colors.danger` (errores y acciones destructivas) y `viewer` (fondo negro del visor de páginas). La prueba `src/ui/themes.test.ts` verifica el contraste de 4.5:1 en las 8 combinaciones.
- `ringColors`: el dorado de la argolla, igual en todos los temas.

## Pendiente por fase

- Banner de sugerencia del OCR en "Nuevo documento" → fase 6.
- Casilla de alertas → fase 4.
- Botón "Compartir 24 h" en el detalle → fase 8.
- Pestaña "Claves" → fase 7 (por ahora muestra "Muy pronto").

## Reglas de accesibilidad

- El contraste de texto debe ser al menos 4.5:1. Las paletas ya cumplen; si agregas colores, verifícalos.
- Los botones que solo tienen ícono llevan `accessibilityLabel`.
- Las notificaciones y la pantalla bloqueada nunca muestran nombres de documentos.
