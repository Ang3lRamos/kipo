import { fitWithin, type Size } from './fit-within';
import { pipelineConfig } from './pipeline-config';
import { hasWebpMetadata } from './webp-metadata';

// Operaciones nativas que necesita el pipeline. Se inyectan para poder probarlo sin dispositivo.
export type ImageOps = {
  getSize(uri: string): Promise<Size>;
  // Redimensiona (si `size` no es null) y guarda como WebP. Devuelve la URI temporal.
  renderWebp(uri: string, size: Size | null, quality: number): Promise<string>;
  readBytes(uri: string): Promise<Uint8Array>;
};

export type ProcessedImage = { uri: string; width: number; height: number; sizeBytes: number };
export type ProcessedPage = { page: ProcessedImage; thumb: ProcessedImage };

async function renderStep(
  ops: ImageOps,
  sourceUri: string,
  original: Size,
  maxSide: number,
  quality: number,
): Promise<ProcessedImage> {
  const target = fitWithin(original, maxSide);
  const uri = await ops.renderWebp(sourceUri, target, quality);
  const bytes = await ops.readBytes(uri);
  // Recomprimir elimina EXIF/GPS; aquí se verifica en vez de suponerlo.
  if (hasWebpMetadata(bytes)) {
    throw new Error('La imagen procesada todavía tiene metadatos EXIF/XMP');
  }
  const size = target ?? original;
  return { uri, width: size.width, height: size.height, sizeBytes: bytes.length };
}

// Orden del pipeline: redimensionar y comprimir → miniatura. El cifrado llega en la fase 3.
export async function processImage(ops: ImageOps, sourceUri: string): Promise<ProcessedPage> {
  const original = await ops.getSize(sourceUri);
  const { pageMaxSide, pageQuality, thumbMaxSide, thumbQuality } = pipelineConfig;
  const page = await renderStep(ops, sourceUri, original, pageMaxSide, pageQuality);
  // La miniatura sale de la página ya reducida: es más rápido que partir del original.
  const thumb = await renderStep(ops, page.uri, page, thumbMaxSide, thumbQuality);
  return { page, thumb };
}
