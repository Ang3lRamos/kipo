import { CreditCard, KeyRound, Repeat, StickyNote, type LucideIcon } from 'lucide-react-native';

import type { SecretKind } from '@/types/secret';

// Nombre, ícono y color (una categoría pastel del tema) de cada tipo de clave.
export const kindInfo: Record<
  SecretKind,
  { label: string; icon: LucideIcon; tint: 'vehiculo' | 'garantias' | 'finanzas' | 'hogar' }
> = {
  login: { label: 'Inicio de sesión', icon: KeyRound, tint: 'vehiculo' },
  note: { label: 'Nota segura', icon: StickyNote, tint: 'garantias' },
  card: { label: 'Tarjeta', icon: CreditCard, tint: 'finanzas' },
  subscription: { label: 'Suscripción', icon: Repeat, tint: 'hogar' },
};
