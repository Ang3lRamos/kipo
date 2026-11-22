import { fitWithin } from './fit-within';

describe('fitWithin', () => {
  it('reduce el lado largo y conserva la proporción', () => {
    expect(fitWithin({ width: 4032, height: 3024 }, 1800)).toEqual({ width: 1800, height: 1350 });
    expect(fitWithin({ width: 3024, height: 4032 }, 1800)).toEqual({ width: 1350, height: 1800 });
  });

  it('no agranda imágenes pequeñas', () => {
    expect(fitWithin({ width: 1200, height: 800 }, 1800)).toBeNull();
    expect(fitWithin({ width: 1800, height: 1800 }, 1800)).toBeNull();
  });

  it('nunca devuelve un lado de 0 px', () => {
    expect(fitWithin({ width: 10000, height: 1 }, 300)).toEqual({ width: 300, height: 1 });
  });
});
