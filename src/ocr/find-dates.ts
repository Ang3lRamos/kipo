import { isValidIsoDate } from '@/features/documents/dates';

import { fold } from './text';

// Encuentra fechas en texto de documentos colombianos y decide cuál es el vencimiento y cuál
// la expedición según las palabras que tienen justo antes ("hasta", "vence", "expedición"…).

const months: Record<string, number> = {
  ene: 1,
  enero: 1,
  jan: 1,
  feb: 2,
  febrero: 2,
  mar: 3,
  marzo: 3,
  abr: 4,
  abril: 4,
  apr: 4,
  may: 5,
  mayo: 5,
  jun: 6,
  junio: 6,
  jul: 7,
  julio: 7,
  ago: 8,
  agosto: 8,
  aug: 8,
  sep: 9,
  sept: 9,
  septiembre: 9,
  setiembre: 9,
  oct: 10,
  octubre: 10,
  nov: 11,
  noviembre: 11,
  dic: 12,
  diciembre: 12,
  dec: 12,
};

// Después de la palabra clave se aceptan conectores: "válido hasta el 31 de diciembre…".
const connectors = String.raw`(?:\W+(?:el|la|del|al|de|en))*\W*$`;
const expiryWords = new RegExp(
  String.raw`(vence|vencimiento|valid[oa] hasta|vigente hasta|vigencia hasta|hasta|expira|expiracion|caduca)` +
    connectors,
);
const issueWords = new RegExp(
  String.raw`(expedicion|expedid[oa]|emision|emitid[oa]|desde|fecha de inicio|otorgad[oa])` +
    connectors,
);

type FoundDate = { iso: string; index: number };

const pad = (n: number) => String(n).padStart(2, '0');

function toIso(year: number, month: number, day: number): string | null {
  const iso = `${year}-${pad(month)}-${pad(day)}`;
  return isValidIsoDate(iso) && year >= 1950 && year <= 2100 ? iso : null;
}

export function findDates(text: string): FoundDate[] {
  const folded = fold(text);
  const found: FoundDate[] = [];
  const add = (iso: string | null, index: number) => {
    if (iso) found.push({ iso, index });
  };

  // 14/01/2027, 14-01-2027, 14.01.2027
  for (const m of folded.matchAll(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g)) {
    add(toIso(Number(m[3]), Number(m[2]), Number(m[1])), m.index);
  }
  // 2027-01-14
  for (const m of folded.matchAll(/\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/g)) {
    add(toIso(Number(m[1]), Number(m[2]), Number(m[3])), m.index);
  }
  // 12-MAR-2010, 12 mar 2010, 12 de marzo de 2027
  for (const m of folded.matchAll(
    /\b(\d{1,2})(?:\s+de\s+|[\s/.-]+)([a-z]{3,10})\.?(?:\s+de\s+|[\s/.-]+)(\d{4})\b/g,
  )) {
    const month = months[m[2] ?? ''];
    if (month) add(toIso(Number(m[3]), month, Number(m[1])), m.index);
  }
  return found.sort((a, b) => a.index - b.index);
}

export type DateGuess = { expiresAt?: string; issuedAt?: string };

// Mira hasta 40 caracteres antes de cada fecha buscando la palabra que la describe.
export function guessDates(text: string): DateGuess {
  const folded = fold(text);
  const guess: DateGuess = {};
  for (const date of findDates(text)) {
    const before = folded.slice(Math.max(0, date.index - 40), date.index);
    if (expiryWords.test(before)) {
      if (!guess.expiresAt || date.iso > guess.expiresAt) guess.expiresAt = date.iso;
    } else if (issueWords.test(before)) {
      if (!guess.issuedAt) guess.issuedAt = date.iso;
    }
  }
  return guess;
}
