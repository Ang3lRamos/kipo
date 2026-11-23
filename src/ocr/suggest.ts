import type { Category } from '@/types/document';

import { guessDates } from './find-dates';
import { fold } from './text';

// Sugerencias a partir del texto del OCR, con reglas simples (PLAN.md, fase 6).
// Solo propone: el usuario decide si las usa.

export type Suggestion = {
  title?: string;
  category?: Category;
  expiresAt?: string;
  issuedAt?: string;
};

// Documentos conocidos: si aparece la frase, ya sabemos título y categoría.
const knownDocuments: { pattern: RegExp; title: string; category: Category }[] = [
  { pattern: /cedula de ciudadania/, title: 'Cédula de ciudadanía', category: 'identidad' },
  { pattern: /tarjeta de identidad/, title: 'Tarjeta de identidad', category: 'identidad' },
  { pattern: /registro civil/, title: 'Registro civil', category: 'identidad' },
  { pattern: /pasaporte|passport/, title: 'Pasaporte', category: 'identidad' },
  { pattern: /licencia de conduccion/, title: 'Licencia de conducción', category: 'vehiculo' },
  { pattern: /\bsoat\b|seguro obligatorio/, title: 'SOAT', category: 'vehiculo' },
  {
    pattern: /revision tecnico ?-?mecanica|tecnicomecanica/,
    title: 'Revisión técnico-mecánica',
    category: 'vehiculo',
  },
  {
    pattern: /licencia de transito|tarjeta de propiedad/,
    title: 'Tarjeta de propiedad del vehículo',
    category: 'vehiculo',
  },
  { pattern: /historia clinica/, title: 'Historia clínica', category: 'salud' },
  { pattern: /formula medica/, title: 'Fórmula médica', category: 'salud' },
  { pattern: /vacuna/, title: 'Certificado de vacunas', category: 'salud' },
  { pattern: /contrato de arrendamiento/, title: 'Contrato de arrendamiento', category: 'hogar' },
  {
    pattern: /certificado laboral|certificacion laboral/,
    title: 'Certificado laboral',
    category: 'laboral',
  },
  {
    pattern: /contrato (individual )?de trabajo/,
    title: 'Contrato de trabajo',
    category: 'laboral',
  },
  { pattern: /extracto/, title: 'Extracto bancario', category: 'finanzas' },
  {
    pattern: /certificado de garantia|poliza de garantia/,
    title: 'Garantía',
    category: 'garantias',
  },
];

// Si no es un documento conocido, la categoría con más palabras clave.
const categoryWords: Record<Exclude<Category, 'otro'>, string[]> = {
  identidad: ['registraduria', 'identificacion', 'nacionalidad', 'documento de identidad'],
  vehiculo: ['placa', 'vehiculo', 'transito', 'runt', 'motor', 'chasis'],
  salud: ['eps', 'salud', 'afiliacion', 'afiliado', 'medico', 'clinica', 'paciente'],
  finanzas: ['banco', 'tarjeta de credito', 'saldo', 'cuenta de ahorros', 'cuota', 'credito'],
  garantias: ['garantia', 'factura', 'serial', 'modelo', 'compra'],
  laboral: ['empleador', 'nomina', 'salario', 'cargo', 'empresa'],
  hogar: ['arrendatario', 'arrendador', 'inmueble', 'servicios publicos', 'predial'],
};

function guessCategory(folded: string): Category | undefined {
  let best: { category: Category; score: number } | undefined;
  for (const [category, words] of Object.entries(categoryWords)) {
    const score = words.filter((word) => folded.includes(word)).length;
    if (score > 0 && (!best || score > best.score))
      best = { category: category as Category, score };
  }
  return best?.category;
}

// Primera línea que parezca un título (con letras, ni muy corta ni muy larga).
function guessTitle(text: string): string | undefined {
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    const letters = (trimmed.match(/\p{L}/gu) ?? []).length;
    if (trimmed.length < 4 || trimmed.length > 60 || letters / trimmed.length < 0.6) continue;
    const isUpper = trimmed === trimmed.toUpperCase();
    const pretty = isUpper ? trimmed.toLowerCase() : trimmed;
    return pretty.charAt(0).toUpperCase() + pretty.slice(1);
  }
  return undefined;
}

export function suggestFromText(text: string): Suggestion {
  if (!text.trim()) return {};
  const folded = fold(text);
  const known = knownDocuments.find((doc) => doc.pattern.test(folded));
  const suggestion: Suggestion = { ...guessDates(text) };
  const title = known?.title ?? guessTitle(text);
  const category = known?.category ?? guessCategory(folded);
  if (title) suggestion.title = title;
  if (category) suggestion.category = category;
  return suggestion;
}

export function hasSuggestion(s: Suggestion): boolean {
  return Boolean(s.title || s.category || s.expiresAt || s.issuedAt);
}
