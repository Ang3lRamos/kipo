import {
  Briefcase,
  Car,
  FileText,
  HeartPulse,
  House,
  IdCard,
  Receipt,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import type { Category } from '@/types/document';

// Nombre e ícono de cada categoría. Los colores pastel vienen de theme.colors.categories.
export const categoryInfo: Record<Category, { label: string; icon: LucideIcon }> = {
  identidad: { label: 'Identidad', icon: IdCard },
  vehiculo: { label: 'Vehículo', icon: Car },
  salud: { label: 'Salud', icon: HeartPulse },
  finanzas: { label: 'Finanzas', icon: Wallet },
  garantias: { label: 'Garantías', icon: Receipt },
  laboral: { label: 'Laboral', icon: Briefcase },
  hogar: { label: 'Hogar', icon: House },
  otro: { label: 'Otro', icon: FileText },
};
