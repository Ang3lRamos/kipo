import type { Category } from '@/types/document';

export const categoryInfo: Record<Category, { label: string; icon: string }> = {
  identidad: { label: 'Identidad', icon: '🪪' },
  vehiculo: { label: 'Vehículo', icon: '🚗' },
  salud: { label: 'Salud', icon: '🩺' },
  finanzas: { label: 'Finanzas', icon: '💳' },
  garantias: { label: 'Garantías', icon: '🧾' },
  laboral: { label: 'Laboral', icon: '💼' },
  hogar: { label: 'Hogar', icon: '🏠' },
  otro: { label: 'Otro', icon: '📄' },
};
