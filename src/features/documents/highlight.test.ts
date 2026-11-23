import { hasMatch, matchEnd as e, matchStart as s, parseHighlight } from './highlight';

describe('resaltado de coincidencias', () => {
  it('separa el texto en tramos normales y coincidencias', () => {
    expect(parseHighlight(`Carné ${s}EPS${e} ${s}Sura${e} 2027`)).toEqual([
      { text: 'Carné ', match: false },
      { text: 'EPS', match: true },
      { text: ' ', match: false },
      { text: 'Sura', match: true },
      { text: ' 2027', match: false },
    ]);
  });

  it('texto sin marcas queda igual', () => {
    expect(parseHighlight('scan_0034')).toEqual([{ text: 'scan_0034', match: false }]);
    expect(hasMatch('scan_0034')).toBe(false);
    expect(hasMatch(null)).toBe(false);
  });

  it('tolera una marca sin cerrar (snippet cortado)', () => {
    expect(parseHighlight(`…afiliado a ${s}Sura`)).toEqual([
      { text: '…afiliado a ', match: false },
      { text: 'Sura', match: true },
    ]);
  });
});
