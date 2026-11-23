import { fold } from '@/ocr/text';

import { brandForeground, brandText, findBrand } from './brands';

const find = (text: string) => findBrand(fold(text))?.slug ?? null;

describe('logos de servicios', () => {
  it('reconoce servicios por nombre o sitio', () => {
    expect(find('Netflix familia')).toBe('netflix');
    expect(find('https://www.facebook.com/login')).toBe('facebook');
    expect(find('Cuenta de Gmail del trabajo')).toBe('gmail');
    expect(find('Twitter viejo')).toBe('x');
  });

  it('prefiere la coincidencia más específica', () => {
    expect(find('YouTube Music premium')).toBe('youtubemusic');
    expect(find('HBO Max')).toBe('max');
    expect(find('Mercado Pago')).toBe('mercadopago');
  });

  it('no confunde palabras parecidas ni letras sueltas', () => {
    expect(find('Maximiliano')).toBeNull();
    expect(find('Router de la casa')).toBeNull();
    expect(find('caja fuerte x2')).toBeNull();
  });

  it('busca en el servicio de una suscripción y en el sitio de un inicio de sesión', () => {
    expect(
      findBrand(
        brandText('Pantallas', {
          kind: 'subscription',
          service: 'Spotify',
          account: '',
          password: '',
          profile: '',
          amount: '',
          period: 'mensual',
          renewsAt: '',
          notes: '',
          fields: [],
        }),
      )?.slug,
    ).toBe('spotify');
  });

  it('elige blanco o negro según el color de la marca', () => {
    expect(brandForeground('#E50914')).toBe('#FFFFFF'); // rojo Netflix
    expect(brandForeground('#FFFC00')).toBe('#000000'); // amarillo Snapchat
  });
});
