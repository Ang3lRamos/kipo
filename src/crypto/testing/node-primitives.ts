// Solo para pruebas: las mismas primitivas que en el teléfono, pero sobre el `crypto` de Node.
// react-native-quick-crypto replica la API de Node, así que se prueba el mismo código.
import * as nodeCrypto from 'node:crypto';

import { createPrimitives, type NodeLikeCrypto } from '../primitives';

export const nodePrimitives = createPrimitives(nodeCrypto as unknown as NodeLikeCrypto);

// Parámetros bajos para que las pruebas sean rápidas. Nunca usarlos en la app.
export const fastKdfParams = { memoryKiB: 1024, passes: 1, parallelism: 1 } as const;
