import { buildFtsQuery } from './fts-query';

describe('buildFtsQuery', () => {
  it('devuelve null si no hay palabras', () => {
    expect(buildFtsQuery('')).toBeNull();
    expect(buildFtsQuery('  -- !! ')).toBeNull();
  });

  it('busca cada palabra por prefijo', () => {
    expect(buildFtsQuery('cédula angel')).toBe('"cédula"* "angel"*');
  });

  it('neutraliza operadores y comillas de FTS5', () => {
    expect(buildFtsQuery('soat OR "x" NEAR(-a)')).toBe('"soat"* "OR"* "x"* "NEAR"* "a"*');
  });

  it('limita la cantidad de términos', () => {
    const query = buildFtsQuery(Array.from({ length: 20 }, (_, i) => `t${i}`).join(' '));
    expect(query?.split(' ')).toHaveLength(10);
  });
});
