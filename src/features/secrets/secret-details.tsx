import { formatDate } from '@/features/documents/dates';
import type { CustomField, SecretData } from '@/types/secret';
import { formatMoneyInput } from '@/ui/input-format';

import { SecretValueRow } from './secret-value-row';
import { TotpView } from './totp-view';

function CustomFields({ fields }: { fields: CustomField[] }) {
  return (
    <>
      {fields.map((field) => (
        <SecretValueRow
          key={field.id}
          label={field.label || 'Campo'}
          value={field.value}
          secret={field.secret}
        />
      ))}
    </>
  );
}

// Los datos de una clave según su tipo. Contraseñas y campos secretos aparecen ocultos.
export function SecretDetails({ data }: { data: SecretData }) {
  switch (data.kind) {
    case 'login':
      return (
        <>
          <SecretValueRow label="Usuario" value={data.username} />
          <SecretValueRow label="Contraseña" value={data.password} secret />
          <SecretValueRow label="Sitio o app" value={data.url} />
          {data.totp ? <TotpView secret={data.totp} /> : null}
          <CustomFields fields={data.fields} />
          <SecretValueRow label="Notas" value={data.notes} />
        </>
      );
    case 'note':
      return (
        <>
          <SecretValueRow label="Contenido" value={data.body} secret />
          <CustomFields fields={data.fields} />
        </>
      );
    case 'card':
      return (
        <>
          <SecretValueRow label="Banco" value={data.bank} />
          <SecretValueRow label="Termina en" value={data.last4} monospace />
          <SecretValueRow label="Titular" value={data.holder} />
          <CustomFields fields={data.fields} />
          <SecretValueRow label="Notas" value={data.notes} />
        </>
      );
    case 'subscription':
      return (
        <>
          <SecretValueRow label="Servicio" value={data.service} />
          <SecretValueRow label="Correo o usuario" value={data.account} />
          <SecretValueRow label="Contraseña" value={data.password} secret />
          <SecretValueRow label="Perfil" value={data.profile} />
          <CustomFields fields={data.fields} />
          <SecretValueRow
            label="Valor"
            value={data.amount ? `${formatMoneyInput(data.amount)} (${data.period})` : ''}
          />
          <SecretValueRow
            label="Próxima renovación"
            value={data.renewsAt ? formatDate(data.renewsAt) : ''}
          />
          <SecretValueRow label="Notas" value={data.notes} />
        </>
      );
  }
}
