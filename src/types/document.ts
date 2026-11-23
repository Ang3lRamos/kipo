export const categories = [
  'identidad',
  'vehiculo',
  'salud',
  'finanzas',
  'garantias',
  'laboral',
  'hogar',
  'otro',
] as const;

export type Category = (typeof categories)[number];

export type DocumentRecord = {
  id: string;
  title: string;
  category: Category;
  tags: string[];
  physicalLocation: string | null;
  issuedAt: string | null; // AAAA-MM-DD
  expiresAt: string | null; // AAAA-MM-DD
  notes: string | null;
  ocrText: string | null;
  filePath: string | null;
  thumbPath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  createdAt: string; // ISO 8601
  updatedAt: string;
  deletedAt: string | null;
  syncedAt: string | null;
  alertsEnabled: boolean; // avisos de vencimiento para este documento
};

// Campos que el usuario edita en el formulario.
export type DocumentInput = Pick<
  DocumentRecord,
  | 'title'
  | 'category'
  | 'tags'
  | 'physicalLocation'
  | 'issuedAt'
  | 'expiresAt'
  | 'notes'
  | 'alertsEnabled'
>;

export const activityActions = ['creado', 'editado', 'visto', 'compartido'] as const;
export type ActivityAction = (typeof activityActions)[number];

export type ActivityEntry = {
  id: string;
  documentId: string;
  action: ActivityAction;
  createdAt: string;
};
