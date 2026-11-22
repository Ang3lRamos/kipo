import { hasWebpMetadata, isWebp, listWebpChunks } from './webp-metadata';

function chunk(fourCC: string, payloadSize: number): number[] {
  const header = [...fourCC].map((c) => c.charCodeAt(0));
  const size = [payloadSize & 0xff, (payloadSize >> 8) & 0xff, 0, 0];
  const padding = payloadSize % 2;
  return [...header, ...size, ...new Array<number>(payloadSize + padding).fill(0)];
}

function webp(...chunks: number[][]): Uint8Array {
  const body = chunks.flat();
  const riff = [...'RIFF'].map((c) => c.charCodeAt(0));
  const total = body.length + 4;
  const size = [total & 0xff, (total >> 8) & 0xff, 0, 0];
  const tag = [...'WEBP'].map((c) => c.charCodeAt(0));
  return new Uint8Array([...riff, ...size, ...tag, ...body]);
}

describe('metadatos WebP', () => {
  it('lista los chunks, incluido el relleno de tamaño impar', () => {
    const file = webp(chunk('VP8X', 10), chunk('VP8 ', 7), chunk('EXIF', 3));
    expect(listWebpChunks(file)).toEqual(['VP8X', 'VP8 ', 'EXIF']);
  });

  it('detecta EXIF y XMP', () => {
    expect(hasWebpMetadata(webp(chunk('VP8X', 10), chunk('VP8 ', 20), chunk('EXIF', 4)))).toBe(
      true,
    );
    expect(hasWebpMetadata(webp(chunk('VP8X', 10), chunk('XMP ', 4), chunk('VP8 ', 20)))).toBe(
      true,
    );
  });

  it('acepta un WebP limpio', () => {
    expect(hasWebpMetadata(webp(chunk('VP8 ', 20)))).toBe(false);
  });

  it('rechaza archivos que no son WebP', () => {
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(isWebp(jpeg)).toBe(false);
    expect(() => listWebpChunks(jpeg)).toThrow();
  });
});
