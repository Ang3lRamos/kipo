import { emptyFormValues, parseTagList, validateForm } from './form-values';

describe('validateForm', () => {
  it('exige un título', () => {
    const result = validateForm({ ...emptyFormValues, title: '   ' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.title).toBeDefined();
  });

  it('rechaza fechas mal escritas y vencimientos antes de la expedición', () => {
    const bad = validateForm({ ...emptyFormValues, title: 'SOAT', expiresAt: '31/12/2026' });
    expect(bad.ok).toBe(false);

    const reversed = validateForm({
      ...emptyFormValues,
      title: 'SOAT',
      issuedAt: '2026-05-01',
      expiresAt: '2026-04-01',
    });
    expect(reversed.ok).toBe(false);
  });

  it('limpia espacios y convierte vacíos en null', () => {
    const result = validateForm({
      ...emptyFormValues,
      title: '  Pasaporte ',
      category: 'identidad',
      tags: 'Viaje, original, viaje',
      expiresAt: '2030-06-01',
    });
    expect(result).toEqual({
      ok: true,
      input: {
        title: 'Pasaporte',
        category: 'identidad',
        tags: ['viaje', 'original'],
        physicalLocation: null,
        issuedAt: null,
        expiresAt: '2030-06-01',
        notes: null,
        alertsEnabled: true,
      },
    });
  });
});

describe('parseTagList', () => {
  it('ignora etiquetas vacías', () => {
    expect(parseTagList(' , a,, b ,')).toEqual(['a', 'b']);
  });
});
