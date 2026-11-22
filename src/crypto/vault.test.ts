import { WrongPasswordError, WrongRecoveryKeyError } from './errors';
import { formatRecoveryKey } from './recovery-key';
import { fastKdfParams, nodePrimitives as crypto } from './testing/node-primitives';
import {
  changePassword,
  createVault,
  parseVaultRecord,
  serializeVaultRecord,
  unlockWithPassword,
  unlockWithRecoveryKey,
} from './vault';

const password = 'mi frase maestra larga y rara 2026';

async function newVault() {
  return createVault(crypto, password, { ...fastKdfParams });
}

describe('bóveda (jerarquía de claves)', () => {
  it('se desbloquea con la contraseña maestra y devuelve la misma DEK', async () => {
    const { record, dek } = await newVault();
    expect(dek).toHaveLength(32);
    expect(await unlockWithPassword(crypto, record, password)).toEqual(dek);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const { record } = await newVault();
    await expect(unlockWithPassword(crypto, record, 'otra contraseña')).rejects.toThrow(
      WrongPasswordError,
    );
  });

  it('se desbloquea con la clave de recuperación', async () => {
    const { record, dek, recoveryKey } = await newVault();
    expect(unlockWithRecoveryKey(crypto, record, formatRecoveryKey(recoveryKey))).toEqual(dek);
  });

  it('rechaza una clave de recuperación que no es la de esta bóveda', async () => {
    const { record } = await newVault();
    const { recoveryKey: otherKey } = await newVault();
    expect(() => unlockWithRecoveryKey(crypto, record, formatRecoveryKey(otherKey))).toThrow(
      WrongRecoveryKeyError,
    );
  });

  it('cambiar la contraseña conserva la DEK y anula la anterior', async () => {
    const { record, dek, recoveryKey } = await newVault();
    const updated = await changePassword(crypto, record, dek, 'nueva frase maestra 2027', {
      ...fastKdfParams,
    });
    expect(await unlockWithPassword(crypto, updated, 'nueva frase maestra 2027')).toEqual(dek);
    await expect(unlockWithPassword(crypto, updated, password)).rejects.toThrow(WrongPasswordError);
    // La clave de recuperación sigue sirviendo.
    expect(unlockWithRecoveryKey(crypto, updated, formatRecoveryKey(recoveryKey))).toEqual(dek);
    // Sal nueva: no se reutiliza la derivación anterior.
    expect(updated.kdf.salt).not.toEqual(record.kdf.salt);
  });

  it('el registro serializado no contiene la DEK ni la contraseña', async () => {
    const { record, dek } = await newVault();
    const json = serializeVaultRecord(record);
    expect(json).not.toContain(Buffer.from(dek).toString('base64'));
    expect(json).not.toContain(Buffer.from(dek).toString('hex'));
    expect(json).not.toContain(password);
  });

  it('el registro se puede guardar y volver a leer', async () => {
    const { record, dek } = await newVault();
    const restored = parseVaultRecord(serializeVaultRecord(record));
    expect(await unlockWithPassword(crypto, restored, password)).toEqual(dek);
  });

  it('rechaza registros con formato o versión desconocidos', () => {
    expect(() => parseVaultRecord('{"v":99}')).toThrow();
    expect(() => parseVaultRecord('no es json')).toThrow();
  });
});
