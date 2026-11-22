import QuickCrypto from 'react-native-quick-crypto';

import { createPrimitives, type NodeLikeCrypto } from './primitives';

// Primitivas del teléfono: OpenSSL nativo vía react-native-quick-crypto (API de Node).
export const nativePrimitives = createPrimitives(QuickCrypto as unknown as NodeLikeCrypto);
