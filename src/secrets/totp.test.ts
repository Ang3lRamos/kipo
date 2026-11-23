import { base32nopad } from '@scure/base';

import { parseTotp, secondsLeft, totpCode, type TotpConfig } from './totp';

// Vectores oficiales del RFC 6238 (apéndice B), 8 dígitos.
const ascii = (s: string) => new TextEncoder().encode(s);
const rfc = (algorithm: TotpConfig['algorithm'], secret: string): TotpConfig => ({
  secret: ascii(secret),
  digits: 8,
  period: 30,
  algorithm,
});
const sha1 = rfc('SHA1', '12345678901234567890');
const sha256 = rfc('SHA256', '12345678901234567890123456789012');
const sha512 = rfc('SHA512', '1234567890123456789012345678901234567890123456789012345678901234');

describe('TOTP (RFC 6238)', () => {
  it.each([
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
  ])('t=%i', (seconds, s1, s256, s512) => {
    expect(totpCode(sha1, seconds * 1000)).toBe(s1);
    expect(totpCode(sha256, seconds * 1000)).toBe(s256);
    expect(totpCode(sha512, seconds * 1000)).toBe(s512);
  });

  it('lee la clave en base32 con espacios y minúsculas (6 dígitos por defecto)', () => {
    const encoded = base32nopad.encode(ascii('12345678901234567890')).toLowerCase();
    const config = parseTotp(encoded.replace(/(.{4})/g, '$1 '));
    expect(config).toMatchObject({ digits: 6, period: 30, algorithm: 'SHA1' });
    expect(totpCode(config, 59_000)).toBe('287082');
  });

  it('lee una URI otpauth:// como la del QR', () => {
    const secret = base32nopad.encode(ascii('12345678901234567890'));
    const config = parseTotp(
      `otpauth://totp/Banco:angel?secret=${secret}&issuer=Banco&digits=8&period=30&algorithm=SHA1`,
    );
    expect(totpCode(config, 59_000)).toBe('94287082');
  });

  it('rechaza claves o URIs inválidas', () => {
    expect(() => parseTotp('no es base32!')).toThrow();
    expect(() => parseTotp('otpauth://hotp/x?secret=JBSWY3DP')).toThrow();
    expect(() => parseTotp('otpauth://totp/x?secret=JBSWY3DP&digits=4')).toThrow();
  });

  it('cuenta los segundos que le quedan al código', () => {
    expect(secondsLeft(sha1, 59_000)).toBe(1);
    expect(secondsLeft(sha1, 60_000)).toBe(30);
  });
});
