import type { Size } from './fit-within';
import { processImage, type ImageOps } from './image-pipeline';

const cleanWebp = (payload: number) =>
  new Uint8Array([
    ...[...'RIFF'].map((c) => c.charCodeAt(0)),
    0,
    0,
    0,
    0,
    ...[...'WEBPVP8 '].map((c) => c.charCodeAt(0)),
    payload & 0xff,
    (payload >> 8) & 0xff,
    0,
    0,
    ...new Array<number>(payload).fill(0),
  ]);

function fakeOps(original: Size, options: { withExif?: boolean } = {}) {
  const renders: { uri: string; size: Size | null; quality: number }[] = [];
  const ops: ImageOps = {
    getSize: async () => original,
    renderWebp: async (uri, size, quality) => {
      renders.push({ uri, size, quality });
      return `tmp-${renders.length}.webp`;
    },
    readBytes: async () => {
      const bytes = cleanWebp(100);
      if (options.withExif)
        bytes.set(
          [...'EXIF'].map((c) => c.charCodeAt(0)),
          12,
        );
      return bytes;
    },
  };
  return { ops, renders };
}

describe('processImage', () => {
  it('reduce a 1800 px, luego hace la miniatura de 300 px a partir de la página', async () => {
    const { ops, renders } = fakeOps({ width: 4032, height: 3024 });
    const result = await processImage(ops, 'camara.jpg');

    expect(renders).toEqual([
      { uri: 'camara.jpg', size: { width: 1800, height: 1350 }, quality: 0.75 },
      { uri: 'tmp-1.webp', size: { width: 300, height: 225 }, quality: 0.6 },
    ]);
    expect(result.page).toMatchObject({ uri: 'tmp-1.webp', width: 1800, height: 1350 });
    expect(result.thumb).toMatchObject({ uri: 'tmp-2.webp', width: 300, height: 225 });
    expect(result.page.sizeBytes).toBeGreaterThan(0);
  });

  it('recomprime aunque la imagen ya sea pequeña, para quitar metadatos', async () => {
    const { ops, renders } = fakeOps({ width: 1000, height: 700 });
    const result = await processImage(ops, 'chica.jpg');
    expect(renders[0]).toEqual({ uri: 'chica.jpg', size: null, quality: 0.75 });
    expect(result.page).toMatchObject({ width: 1000, height: 700 });
  });

  it('falla si el resultado conserva EXIF', async () => {
    const { ops } = fakeOps({ width: 4032, height: 3024 }, { withExif: true });
    await expect(processImage(ops, 'gps.jpg')).rejects.toThrow('metadatos');
  });
});
