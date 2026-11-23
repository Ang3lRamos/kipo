import {
  dateError,
  dateForDisplay,
  dateFromInput,
  formatMoneyInput,
  liveDateError,
  maskDateInput,
} from './input-format';

describe('fechas mientras se escriben', () => {
  it('pone las barras solas', () => {
    expect(maskDateInput('1')).toBe('1');
    expect(maskDateInput('14')).toBe('14');
    expect(maskDateInput('140')).toBe('14/0');
    expect(maskDateInput('1401')).toBe('14/01');
    expect(maskDateInput('14012027')).toBe('14/01/2027');
    expect(maskDateInput('14/01/20279')).toBe('14/01/2027'); // no pasa de 8 dígitos
  });

  it('no deja escribir días ni meses imposibles', () => {
    expect(maskDateInput('5')).toBe('05'); // un día que empieza en 5 solo puede ser 05
    expect(maskDateInput('32')).toBe('3'); // el día 32 no existe
    expect(maskDateInput('00')).toBe('0');
    expect(maskDateInput('142')).toBe('14/02'); // mes que empieza en 2 → 02
    expect(maskDateInput('1413')).toBe('14/1'); // el mes 13 no existe
    expect(maskDateInput('31122027')).toBe('31/12/2027');
  });

  it('avisa al instante si la fecha completa no existe', () => {
    expect(liveDateError('31/02/2027')).toBe('Esa fecha no existe');
    expect(liveDateError('31/02')).toBeUndefined(); // todavía incompleta
    expect(liveDateError('2027-02-28')).toBeUndefined();
  });

  it('borrar una barra no la vuelve a poner de más', () => {
    expect(maskDateInput('14/0')).toBe('14/0');
    expect(maskDateInput('14/')).toBe('14');
  });

  it('guarda AAAA-MM-DD cuando la fecha está completa y existe', () => {
    expect(dateFromInput('14/01/2027')).toBe('2027-01-14');
    expect(dateFromInput('14012027')).toBe('2027-01-14');
    expect(dateFromInput('31/02/2027')).toBe('31/02/2027'); // no existe: queda para avisar
    expect(dateFromInput('14/01')).toBe('14/01');
  });

  it('muestra a la colombiana lo que está guardado', () => {
    expect(dateForDisplay('2027-01-14')).toBe('14/01/2027');
    expect(dateForDisplay('14/01')).toBe('14/01');
    expect(dateForDisplay('')).toBe('');
  });

  it('explica qué le falta a la fecha', () => {
    expect(dateError('')).toBeUndefined();
    expect(dateError('2027-01-14')).toBeUndefined();
    expect(dateError('14/01')).toMatch(/incompleta/);
    expect(dateError('31/02/2027')).toMatch(/no existe/);
  });
});

describe('valores en pesos', () => {
  it('pone el signo y los puntos de miles', () => {
    expect(formatMoneyInput('38900')).toBe('$ 38.900');
    expect(formatMoneyInput('1250000')).toBe('$ 1.250.000');
    expect(formatMoneyInput('900')).toBe('$ 900');
  });

  it('acepta lo que ya traía formato y lo vacío', () => {
    expect(formatMoneyInput('$38.900')).toBe('$ 38.900');
    expect(formatMoneyInput('$ ')).toBe('');
    expect(formatMoneyInput('')).toBe('');
    expect(formatMoneyInput('007')).toBe('$ 7');
  });
});
