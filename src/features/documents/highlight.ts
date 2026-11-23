// Las consultas de búsqueda marcan las coincidencias con char(2) … char(3)
// (src/db/documents-repo.ts). Aquí se convierten en tramos para pintarlos.

export const matchStart = '\u0002';
export const matchEnd = '\u0003';

export type Segment = { text: string; match: boolean };

export function parseHighlight(marked: string): Segment[] {
  const segments: Segment[] = [];
  let rest = marked;
  while (rest.length > 0) {
    const start = rest.indexOf(matchStart);
    if (start < 0) {
      segments.push({ text: rest, match: false });
      break;
    }
    if (start > 0) segments.push({ text: rest.slice(0, start), match: false });
    const end = rest.indexOf(matchEnd, start + 1);
    const stop = end < 0 ? rest.length : end;
    segments.push({ text: rest.slice(start + 1, stop), match: true });
    rest = end < 0 ? '' : rest.slice(end + 1);
  }
  return segments.filter((segment) => segment.text.length > 0);
}

export function hasMatch(marked: string | null | undefined): marked is string {
  return typeof marked === 'string' && marked.includes(matchStart);
}
