import { extractTextFromImage, isSupported } from 'expo-text-extractor';
import PdfThumbnail, { PdfThumbnailErrorCodes } from 'react-native-pdf-thumbnail';

import { cleanOcrLines } from './text';

// OCR en el teléfono (ML Kit en Android, Vision en iOS). La imagen nunca sale del dispositivo.
// Nunca lanza: si el OCR falla, el documento se guarda igual, solo que sin texto.
export async function recognizeImage(uri: string): Promise<string> {
  if (!isSupported) return '';
  try {
    return cleanOcrLines(await extractTextFromImage(uri));
  } catch (error) {
    console.warn('El OCR no pudo leer una imagen', error);
    return '';
  }
}

export const maxPdfPages = 10;
const renderSize = { quality: 85, maxWidth: 2000, maxHeight: 2000 };

// Convierte las páginas de un PDF en JPEG temporales (en la caché) para poder leerlas.
// Quien llama debe borrar los temporales.
export async function renderPdfPages(uri: string, limit = maxPdfPages): Promise<string[]> {
  const pages: string[] = [];
  for (let page = 0; page < limit; page++) {
    try {
      pages.push((await PdfThumbnail.generate(uri, page, renderSize)).uri);
    } catch (error) {
      const code = (error as { code?: string }).code;
      // INVALID_PAGE: se acabaron las páginas. Cualquier otro error se informa y se para.
      if (code !== PdfThumbnailErrorCodes.INVALID_PAGE) {
        console.warn('No se pudo leer una página del PDF', error);
      }
      break;
    }
  }
  return pages;
}
