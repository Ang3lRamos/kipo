import { isValidIsoDate } from '@/features/documents/dates';

// Formato automático mientras se escribe: fechas DD/MM/AAAA y valores en pesos ($ 38.900).
// Las fechas se guardan siempre como AAAA-MM-DD; en pantalla se muestran a la colombiana.

const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

// Filtra dígito a dígito lo que no puede ser una fecha: el día va de 01 a 31 y el mes de 01
// a 12. Un primer dígito que solo puede ser de un número de una cifra se completa con 0
// ("5" en el día → "05").
function plausibleDigits(raw: string): string {
  let out = '';
  for (const char of raw) {
    const d = Number(char);
    const pos = out.length;
    if (pos === 0) out += d > 3 ? `0${d}` : char;
    else if (pos === 1) {
      const day = Number(out[0]) * 10 + d;
      if (day >= 1 && day <= 31) out += char;
    } else if (pos === 2) out += d > 1 ? `0${d}` : char;
    else if (pos === 3) {
      const month = Number(out[2]) * 10 + d;
      if (month >= 1 && month <= 12) out += char;
    } else if (pos < 8) out += char;
  }
  return out.slice(0, 8);
}

// "14012027" o "14/01/2027" → "14/01/2027"; parcial: "1401" → "14/01".
export function maskDateInput(text: string): string {
  const digits = plausibleDigits(text.replace(/\D/g, ''));
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return parts.join('/');
}

// Error inmediato mientras se escribe: solo cuando ya está completa y no existe (31/02).
export function liveDateError(value: string): string | undefined {
  const complete = value.replace(/\D/g, '').length === 8;
  return complete && !isValidIsoDate(value) ? 'Esa fecha no existe' : undefined;
}

// Valor guardado (AAAA-MM-DD o lo que se lleva escrito) → lo que se ve en el campo.
export function dateForDisplay(value: string): string {
  const match = isoPattern.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

// Lo escrito → lo que se guarda: la fecha ISO si está completa; si no, lo escrito tal cual
// (la validación del formulario avisa que está incompleta).
export function dateFromInput(text: string): string {
  const masked = maskDateInput(text);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(masked);
  if (!match) return masked;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  return isValidIsoDate(iso) ? iso : masked;
}

// Mensaje para una fecha opcional que no está completa o no existe.
export function dateError(value: string): string | undefined {
  if (!value.trim() || isValidIsoDate(value)) return undefined;
  return value.replace(/\D/g, '').length < 8
    ? 'Fecha incompleta: escríbela como DD/MM/AAAA'
    : 'Esa fecha no existe';
}

// "38900" o "$38.900" → "$ 38.900". Pesos colombianos: sin decimales y con punto de miles.
export function formatMoneyInput(text: string): string {
  const digits = text
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
    .slice(0, 15);
  if (!digits) return '';
  return `$ ${digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}
