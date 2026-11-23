import { DecryptionError } from '@/crypto/errors';
import { deriveSubkeys } from '@/crypto/subkeys';
import { nodePrimitives as crypto } from '@/crypto/testing/node-primitives';

import {
  backupFileName,
  encodePreamble,
  InvalidBackupError,
  openManifest,
  parseHeader,
  preambleSize,
  readHeaderLength,
  sealManifest,
  type BackupManifest,
} from './backup-format';

const { metaKey } = deriveSubkeys(crypto.randomBytes(32));
const manifest: BackupManifest = {
  v: 1,
  documents: [{ id: 'doc-1', updatedAt: '2026-11-23T10:00:00.000Z', payload: 'cifrado' }],
  secrets: [],
  files: [{ documentId: 'doc-1', pageId: 'p-1', kind: 'page', offset: 0, length: 120 }],
};

describe('índice del respaldo', () => {
  it('ida y vuelta, y no revela nombres ni rutas', () => {
    const sealed = sealManifest(crypto, metaKey, manifest);
    expect(sealed).not.toContain('doc-1');
    expect(openManifest(crypto, metaKey, sealed)).toEqual(manifest);
  });

  it('nonce nuevo en cada respaldo', () => {
    expect(sealManifest(crypto, metaKey, manifest)).not.toBe(
      sealManifest(crypto, metaKey, manifest),
    );
  });

  it('otra bóveda o un índice alterado no se abren', () => {
    const sealed = sealManifest(crypto, metaKey, manifest);
    const other = deriveSubkeys(crypto.randomBytes(32)).metaKey;
    expect(() => openManifest(crypto, other, sealed)).toThrow(DecryptionError);
    const bytes = Buffer.from(sealed, 'base64');
    bytes.writeUInt8(bytes.readUInt8(bytes.length - 1) ^ 1, bytes.length - 1);
    expect(() => openManifest(crypto, metaKey, bytes.toString('base64'))).toThrow(DecryptionError);
  });

  it('rechaza rutas peligrosas aunque el índice esté bien cifrado', () => {
    const evil = {
      ...manifest,
      files: [{ ...manifest.files[0], documentId: '../../etc' }],
    } as BackupManifest;
    const sealed = sealManifest(crypto, metaKey, evil);
    expect(() => openManifest(crypto, metaKey, sealed)).toThrow(InvalidBackupError);
  });
});

describe('encabezado del archivo', () => {
  const header = { v: 1 as const, createdAt: '2026-11-23', vault: '{}', manifest: 'x' };

  it('se lee lo que se escribió', () => {
    const pre = encodePreamble(header);
    const length = readHeaderLength(pre.subarray(0, 12));
    expect(preambleSize(length)).toBe(pre.length);
    expect(parseHeader(pre.subarray(12))).toEqual(header);
  });

  it('rechaza archivos que no son de Kipo', () => {
    expect(() => readHeaderLength(new TextEncoder().encode('%PDF-1.7 abcd'))).toThrow(
      InvalidBackupError,
    );
    expect(() => readHeaderLength(new Uint8Array(3))).toThrow(InvalidBackupError);
    expect(() => parseHeader(new TextEncoder().encode('{"v":2}'))).toThrow(InvalidBackupError);
  });

  it('nombre con la fecha', () => {
    expect(backupFileName(new Date(2026, 10, 3))).toBe('kipo-2026-11-03.kipo');
  });
});
