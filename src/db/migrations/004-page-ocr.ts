// Fase 6: texto reconocido (OCR) por página. documents.ocr_text es la unión de las páginas
// (la calcula refreshCover) y es lo que indexa la búsqueda FTS5.
export const migration004 = `
ALTER TABLE document_pages ADD COLUMN ocr_text TEXT;
`;
