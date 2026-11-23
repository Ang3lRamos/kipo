import { hmac } from '@noble/hashes/hmac.js';
import { sha1 } from '@noble/hashes/legacy.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { base32nopad } from '@scure/base';

// Códigos de verificación en dos pasos (TOTP, RFC 6238), como Google Authenticator.
// Se calculan en el teléfono con HMAC de @noble/hashes; nada sale de aquí.

export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';
export type TotpConfig = {
  secret: Uint8Array;
  digits: number;
  period: number;
  algorithm: TotpAlgorithm;
};

const hashes = { SHA1: sha1, SHA256: sha256, SHA512: sha512 } as const;

export function decodeBase32Secret(text: string): Uint8Array {
  const normalized = text.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
  if (!/^[A-Z2-7]+$/.test(normalized)) throw new Error('La clave no es base32');
  return base32nopad.decode(normalized);
}

// Acepta la clave en base32 ("JBSW Y3DP…") o una URI otpauth:// (la que trae el QR).
export function parseTotp(input: string): TotpConfig {
  const trimmed = input.trim();
  if (!trimmed.toLowerCase().startsWith('otpauth://')) {
    return { secret: decodeBase32Secret(trimmed), digits: 6, period: 30, algorithm: 'SHA1' };
  }
  // Se lee a mano: en React Native, URL y URLSearchParams no están completos sin polyfill.
  const match = /^otpauth:\/\/([^/?]+)\/?[^?]*\??(.*)$/i.exec(trimmed);
  if (!match || match[1]?.toLowerCase() !== 'totp') {
    throw new Error('Solo se admiten códigos por tiempo (TOTP)');
  }
  const params = new Map<string, string>();
  for (const pair of (match[2] ?? '').split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key) params.set(decodeURIComponent(key).toLowerCase(), decodeURIComponent(value));
  }
  const secret = params.get('secret');
  if (!secret) throw new Error('La URI no tiene la clave (secret)');
  const algorithm = (params.get('algorithm') ?? 'SHA1').toUpperCase();
  const digits = Number(params.get('digits') ?? 6);
  const period = Number(params.get('period') ?? 30);
  if (algorithm !== 'SHA1' && algorithm !== 'SHA256' && algorithm !== 'SHA512') {
    throw new Error(`Algoritmo no admitido: ${algorithm}`);
  }
  if (![6, 7, 8].includes(digits) || !(period > 0 && period <= 300)) {
    throw new Error('Dígitos o periodo inválidos');
  }
  return { secret: decodeBase32Secret(secret), digits, period, algorithm };
}

export function totpCode(config: TotpConfig, timeMs: number): string {
  const counter = Math.floor(timeMs / 1000 / config.period);
  const message = new Uint8Array(8);
  // Contador de 64 bits big-endian (los 32 bits altos bastan hasta el año 10 000).
  new DataView(message.buffer).setUint32(0, Math.floor(counter / 2 ** 32));
  new DataView(message.buffer).setUint32(4, counter >>> 0);
  const mac = hmac(hashes[config.algorithm], config.secret, message);
  const offset = (mac[mac.length - 1] ?? 0) & 0x0f;
  const binary =
    (((mac[offset] ?? 0) & 0x7f) << 24) |
    ((mac[offset + 1] ?? 0) << 16) |
    ((mac[offset + 2] ?? 0) << 8) |
    (mac[offset + 3] ?? 0);
  return String(binary % 10 ** config.digits).padStart(config.digits, '0');
}

export function secondsLeft(config: TotpConfig, timeMs: number): number {
  return config.period - (Math.floor(timeMs / 1000) % config.period);
}
