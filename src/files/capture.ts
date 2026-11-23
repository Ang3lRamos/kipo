import { getDocumentAsync } from 'expo-document-picker';
import { launchImageLibraryAsync } from 'expo-image-picker';

// Lo que entra al pipeline: una imagen (se comprime) o un PDF (se guarda tal cual).
// ocrText: si ya se leyó antes de guardar (para las sugerencias), se reutiliza.
export type CapturedItem = { uri: string; kind: 'image' | 'pdf'; ocrText?: string };

const maxPages = 20;

export async function scanWithCamera(): Promise<CapturedItem[]> {
  // Import dinámico: el módulo nativo no existe en Expo Go y fallaría al abrir la app.
  const scanner = await import('react-native-document-scanner-plugin');
  const result = await scanner.default.scanDocument({
    croppedImageQuality: 95, // se recomprime después; alta calidad para no perder dos veces
    maxNumDocuments: maxPages,
  });
  if (result.status !== scanner.ScanDocumentResponseStatus.Success) return [];
  return (result.scannedImages ?? []).map((uri) => ({ uri, kind: 'image' }));
}

export async function pickFromGallery(): Promise<CapturedItem[]> {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: maxPages,
    exif: false,
    quality: 1,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, kind: 'image' }));
}

export async function pickPdf(): Promise<CapturedItem[]> {
  const result = await getDocumentAsync({
    type: 'application/pdf',
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri, kind: 'pdf' }));
}
