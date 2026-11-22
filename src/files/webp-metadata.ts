// Lectura mínima del contenedor RIFF de WebP para comprobar que no quedan metadatos
// (EXIF con GPS, XMP) después de recomprimir. Solo lee encabezados de chunks.

const textDecoder = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

const readUint32LE = (bytes: Uint8Array, offset: number) =>
  ((bytes[offset] ?? 0) |
    ((bytes[offset + 1] ?? 0) << 8) |
    ((bytes[offset + 2] ?? 0) << 16) |
    ((bytes[offset + 3] ?? 0) << 24)) >>>
  0;

export function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 && textDecoder(bytes, 0, 4) === 'RIFF' && textDecoder(bytes, 8, 4) === 'WEBP'
  );
}

export function listWebpChunks(bytes: Uint8Array): string[] {
  if (!isWebp(bytes)) throw new Error('El archivo no es WebP');
  const chunks: string[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    chunks.push(textDecoder(bytes, offset, 4));
    const size = readUint32LE(bytes, offset + 4);
    // Los chunks se rellenan a tamaño par.
    offset += 8 + size + (size % 2);
  }
  return chunks;
}

export function hasWebpMetadata(bytes: Uint8Array): boolean {
  return listWebpChunks(bytes).some((chunk) => chunk === 'EXIF' || chunk === 'XMP ');
}
