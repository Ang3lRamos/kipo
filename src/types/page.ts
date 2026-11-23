export type PageMimeType = 'image/webp' | 'application/pdf';

export type DocumentPage = {
  id: string;
  documentId: string;
  position: number;
  filePath: string; // relativa a la carpeta de documentos de la app
  thumbPath: string | null; // null en PDFs
  mimeType: PageMimeType;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  ocrText: string | null; // texto reconocido; '' si se analizó y no tenía texto
};

export type NewPage = Omit<DocumentPage, 'position' | 'createdAt'>;
