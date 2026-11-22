import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { ImageOps } from './image-pipeline';

// Implementación real de ImageOps sobre expo-image-manipulator (solo en el dispositivo).
export const expoImageOps: ImageOps = {
  async getSize(uri) {
    const context = ImageManipulator.manipulate(uri);
    const image = await context.renderAsync();
    const size = { width: image.width, height: image.height };
    image.release();
    context.release();
    return size;
  },

  async renderWebp(uri, size, quality) {
    const context = ImageManipulator.manipulate(uri);
    if (size) context.resize(size);
    const image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.WEBP, compress: quality });
    image.release();
    context.release();
    return result.uri;
  },

  async readBytes(uri) {
    return new File(uri).bytes();
  },
};
