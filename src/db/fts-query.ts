// Convierte lo que escribe el usuario en una consulta FTS5 segura.
// Cada palabra se busca por prefijo ("ced" encuentra "cédula") y todas deben aparecer.
export function buildFtsQuery(input: string): string | null {
  const terms = input
    .normalize('NFKC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 0)
    .slice(0, 10);

  if (terms.length === 0) return null;
  // Las comillas dobles neutralizan operadores de FTS5 (AND, OR, NEAR, -, *, :).
  return terms.map((term) => `"${term}"*`).join(' ');
}
