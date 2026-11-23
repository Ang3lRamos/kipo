import { fold } from '@/ocr/text';
import type { SecretData } from '@/types/secret';

import { brandIcons, type BrandIcon } from './brand-icons';

// Reconoce el servicio de una clave (Netflix, Facebook…) para mostrar su logo, que viene
// incluido en la app: nunca se descarga nada de internet.

export type Brand = BrandIcon & { slug: string };

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Palabra completa: "max" no debe coincidir con "maximiliano".
const matchers = Object.entries(brandIcons).map(([slug, icon]) => ({
  brand: { ...icon, slug },
  patterns: icon.keywords.map((k) => new RegExp(`(^|[^a-z0-9])${escape(fold(k))}($|[^a-z0-9])`)),
}));

export function brandText(title: string, data: SecretData): string {
  const parts = [title];
  if (data.kind === 'login') parts.push(data.url);
  if (data.kind === 'subscription') parts.push(data.service);
  if (data.kind === 'card') parts.push(data.bank);
  return fold(parts.join(' '));
}

// La primera marca cuya palabra clave aparezca. Las más específicas van primero en la lista
// (por ejemplo "youtube music" antes que "youtube"), así que se prefiere la coincidencia más larga.
export function findBrand(text: string): Brand | null {
  let best: { brand: Brand; length: number } | null = null;
  for (const { brand, patterns } of matchers) {
    for (const [index, pattern] of patterns.entries()) {
      const keyword = brand.keywords[index] ?? '';
      if (pattern.test(text) && (!best || keyword.length > best.length)) {
        best = { brand, length: keyword.length };
      }
    }
  }
  return best?.brand ?? null;
}

// Blanco o negro sobre el color de la marca, el que tenga más contraste.
export function brandForeground(hex: string): '#FFFFFF' | '#000000' {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r ?? 0) + 0.7152 * lin(g ?? 0) + 0.0722 * lin(b ?? 0);
  return luminance > 0.4 ? '#000000' : '#FFFFFF';
}
