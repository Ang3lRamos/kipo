import { dateForDisplay, dateFromInput, formatMoneyInput, liveDateError } from './input-format';
import { TextField } from './text-field';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  placeholder?: string;
  hint?: string;
};

// Fecha DD/MM/AAAA con las barras automáticas. `value` es AAAA-MM-DD (o lo que se lleva
// escrito, si aún no está completa).
export function DateField({
  label,
  value,
  onChange,
  error,
  placeholder = 'DD/MM/AAAA',
  hint,
}: Props) {
  return (
    <TextField
      label={label}
      value={dateForDisplay(value)}
      onChangeText={(text) => onChange(dateFromInput(text))}
      placeholder={placeholder}
      keyboardType="number-pad"
      maxLength={10}
      // Si la fecha completa no existe (31/02), se avisa al instante, sin esperar a guardar.
      error={liveDateError(value) ?? error}
      {...(hint ? { hint } : {})}
    />
  );
}

// Valor en pesos con signo y puntos de miles automáticos ($ 38.900).
export function MoneyField({ label, value, onChange, error, placeholder = '$ 0', hint }: Props) {
  return (
    <TextField
      label={label}
      value={formatMoneyInput(value)}
      onChangeText={(text) => onChange(formatMoneyInput(text))}
      placeholder={placeholder}
      keyboardType="number-pad"
      error={error}
      {...(hint ? { hint } : {})}
    />
  );
}
