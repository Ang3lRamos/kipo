import { findDates, guessDates } from './find-dates';
import { hasSuggestion, suggestFromText } from './suggest';
import { cleanOcrLines } from './text';

const cedula = `REPUBLICA DE COLOMBIA
IDENTIFICACION PERSONAL
CEDULA DE CIUDADANIA
NUMERO 1.234.567.890
RAMOS
APELLIDOS
FECHA DE EXPEDICION 12-MAR-2010 BOGOTA D.C.`;

const soat = `SEGURO OBLIGATORIO DE ACCIDENTES DE TRANSITO
PLACA ABC123
VIGENCIA DESDE 15/01/2026 HASTA 14/01/2027`;

const eps = `EPS SURA
Carné de afiliación
Afiliado: cotizante
Válido hasta el 31 de diciembre de 2027`;

const arriendo = `CONTRATO DE ARRENDAMIENTO DE VIVIENDA URBANA
Arrendador: ...
Fecha de inicio: 2026-02-01
Vence: 2027-01-31`;

describe('sugerencias desde el OCR', () => {
  it('reconoce la cédula y su fecha de expedición', () => {
    expect(suggestFromText(cedula)).toEqual({
      title: 'Cédula de ciudadanía',
      category: 'identidad',
      issuedAt: '2010-03-12',
    });
  });

  it('reconoce el SOAT con su vigencia desde/hasta', () => {
    expect(suggestFromText(soat)).toEqual({
      title: 'SOAT',
      category: 'vehiculo',
      issuedAt: '2026-01-15',
      expiresAt: '2027-01-14',
    });
  });

  it('un carné de EPS: categoría por palabras clave y fecha escrita en letras', () => {
    const suggestion = suggestFromText(eps);
    expect(suggestion.category).toBe('salud');
    expect(suggestion.expiresAt).toBe('2027-12-31');
    expect(suggestion.title).toBe('Eps sura');
  });

  it('un contrato de arriendo con fechas ISO', () => {
    expect(suggestFromText(arriendo)).toEqual({
      title: 'Contrato de arrendamiento',
      category: 'hogar',
      issuedAt: '2026-02-01',
      expiresAt: '2027-01-31',
    });
  });

  it('no inventa nada con texto vacío o sin sentido', () => {
    expect(suggestFromText('')).toEqual({});
    expect(hasSuggestion(suggestFromText('12 34 ## 99'))).toBe(false);
  });
});

describe('fechas', () => {
  it('ignora fechas imposibles y años fuera de rango', () => {
    expect(findDates('31/02/2026 y 01/01/1800 y 05/06/2027').map((d) => d.iso)).toEqual([
      '2027-06-05',
    ]);
  });

  it('sin palabra clave no adivina vencimiento', () => {
    expect(guessDates('Bogotá, 05/06/2027')).toEqual({});
  });
});

describe('limpieza del texto', () => {
  it('une líneas, quita espacios repetidos y líneas vacías', () => {
    expect(cleanOcrLines(['  EPS   SURA ', '', 'Carné'])).toBe('EPS SURA\nCarné');
  });
});
