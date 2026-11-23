// Utilidades de texto para el OCR (puras, sin dependencias nativas).

export const maxPageChars = 10_000;

// Une las líneas que devuelve el OCR, quita espacios repetidos y limita el tamaño.
export function cleanOcrLines(lines: string[]): string {
  return lines
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .slice(0, maxPageChars);
}

// Minúsculas y sin tildes, para comparar con reglas escritas en español.
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}
