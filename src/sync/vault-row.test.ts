import { fastKdfParams, nodePrimitives as crypto } from '@/crypto/testing/node-primitives';
import { createVault, unlockWithPassword } from '@/crypto/vault';

import { recordToRow, rowToRecord } from './vault-row';

describe('fila de vault_keys', () => {
  it('ida y vuelta: en otro teléfono se desbloquea con la misma contraseña', async () => {
    const { record, dek } = await createVault(crypto, 'frase maestra de prueba 2026', {
      ...fastKdfParams,
    });
    const row = recordToRow(record);
    const restored = rowToRecord(JSON.parse(JSON.stringify(row)));
    expect(await unlockWithPassword(crypto, restored, 'frase maestra de prueba 2026')).toEqual(dek);
  });

  it('no contiene la DEK en claro', async () => {
    const { record, dek } = await createVault(crypto, 'otra frase maestra 2026', {
      ...fastKdfParams,
    });
    const json = JSON.stringify(recordToRow(record));
    expect(json).not.toContain(Buffer.from(dek).toString('base64'));
    expect(json).not.toContain('otra frase maestra');
  });

  it('rechaza filas alteradas', () => {
    expect(() =>
      rowToRecord({
        wrapped_dek: 'x',
        wrapped_dek_recovery: 'y',
        kdf_salt: 'z',
        kdf_params: { alg: 'scrypt', memoryKiB: 1, passes: 1, parallelism: 1 },
      }),
    ).toThrow();
  });
});
