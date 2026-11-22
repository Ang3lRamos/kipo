import { choosePasses, deriveKek, newKdfParams } from './kdf';
import { fastKdfParams, nodePrimitives as crypto } from './testing/node-primitives';

const params = { alg: 'argon2id' as const, ...fastKdfParams, salt: crypto.randomBytes(16) };

describe('derivación de la KEK (Argon2id)', () => {
  it('es determinista para la misma contraseña y sal', async () => {
    const a = await deriveKek(crypto, 'correcto caballo batería grapa', params);
    const b = await deriveKek(crypto, 'correcto caballo batería grapa', params);
    expect(a).toEqual(b);
    expect(a).toHaveLength(32);
  });

  it('cambia con otra contraseña o con otra sal', async () => {
    const base = await deriveKek(crypto, 'contraseña-uno', params);
    expect(await deriveKek(crypto, 'contraseña-dos', params)).not.toEqual(base);
    const otherSalt = { ...params, salt: crypto.randomBytes(16) };
    expect(await deriveKek(crypto, 'contraseña-uno', otherSalt)).not.toEqual(base);
  });

  it('normaliza Unicode: "é" compuesta y descompuesta dan la misma llave', async () => {
    const composed = 'café-secreto';
    const decomposed = 'café-secreto';
    expect(await deriveKek(crypto, composed, params)).toEqual(
      await deriveKek(crypto, decomposed, params),
    );
  });

  it('genera una sal aleatoria de 16 bytes para cada bóveda', () => {
    const a = newKdfParams(crypto, 3);
    const b = newKdfParams(crypto, 3);
    expect(a.salt).toHaveLength(16);
    expect(a.salt).not.toEqual(b.salt);
    expect(a).toMatchObject({ alg: 'argon2id', memoryKiB: 65536, passes: 3, parallelism: 1 });
  });

  it('rechaza contraseñas vacías', async () => {
    await expect(deriveKek(crypto, '', params)).rejects.toThrow();
  });
});

describe('calibración de Argon2id', () => {
  it('elige las pasadas para tardar cerca de 750 ms', () => {
    expect(choosePasses(250)).toBe(3);
    expect(choosePasses(150)).toBe(5);
  });

  it('respeta los límites de 2 a 10 pasadas', () => {
    expect(choosePasses(2000)).toBe(2);
    expect(choosePasses(5)).toBe(10);
  });
});
