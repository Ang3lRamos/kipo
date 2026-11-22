import { base64 } from '@scure/base';

const encoder = new TextEncoder();

export function utf8(text: string): Uint8Array {
  return encoder.encode(text);
}

export function toBase64(bytes: Uint8Array): string {
  return base64.encode(bytes);
}

export function fromBase64(text: string): Uint8Array {
  return base64.decode(text);
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// Sobrescribe con ceros material sensible. En JS no hay garantía total (el recolector puede
// haber copiado los datos), pero reduce el tiempo que las llaves quedan en memoria.
export function wipe(...buffers: (Uint8Array | null | undefined)[]): void {
  for (const buffer of buffers) buffer?.fill(0);
}

export function assertLength(bytes: Uint8Array, length: number, what: string): void {
  if (bytes.length !== length) throw new Error(`${what} debe tener ${length} bytes`);
}
