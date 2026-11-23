import { formatDate } from '@/features/documents/dates';
import type { SecretData } from '@/types/secret';

import { SecretValueRow } from './secret-value-row';
import { TotpView } from './totp-view';

// Los datos de una clave según su tipo. Las contraseñas aparecen ocultas.
export function SecretDetails({ data }: { data: SecretData }) {
  switch (data.kind) {
    case 'login':
      return (
        <>
          <SecretValueRow label="Usuario" value={data.username} />
          <SecretValueRow label="Contraseña" value={data.password} secret />
          <SecretValueRow label="Sitio o app" value={data.url} />
          {data.totp ? <TotpView secret={data.totp} /> : null}
          <SecretValueRow label="Notas" value={data.notes} />
        </>
      );
    case 'note':
      return <SecretValueRow label="Contenido" value={data.body} secret />;
    case 'card':
      return (
        <>
          <SecretValueRow label="Banco" value={data.bank} />
          <SecretValueRow label="Termina en" value={data.last4} monospace />
          <SecretValueRow label="Titular" value={data.holder} />
          <SecretValueRow label="Notas" value={data.notes} />
        </>
      );
    case 'subscription':
      return (
        <>
          <SecretValueRow label="Servicio" value={data.service} />
          <SecretValueRow label="Cuenta" value={data.account} />
          <SecretValueRow
            label="Valor"
            value={data.amount ? `${data.amount} (${data.period})` : ''}
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
