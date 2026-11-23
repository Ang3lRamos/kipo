import { isCloudConfigured, supabase } from './supabase-client';

// Cuenta de la nube: correo + contraseña (distinta de la maestra) y segundo factor TOTP.
// Sin segundo factor, las políticas RLS no dejan leer ni escribir nada.

export type CloudStatus =
  | { kind: 'not-configured' }
  | { kind: 'signed-out' }
  | { kind: 'needs-enroll'; email: string } // falta registrar la app de autenticación
  | { kind: 'needs-code'; email: string; factorId: string } // falta el código de 6 dígitos
  | { kind: 'ready'; email: string; userId: string };

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function cloudStatus(): Promise<CloudStatus> {
  if (!isCloudConfigured) return { kind: 'not-configured' };
  const auth = supabase().auth;
  const { data: sessionData } = await auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { kind: 'signed-out' };
  const email = user.email ?? '';

  const { data: aal, error } = await auth.mfa.getAuthenticatorAssuranceLevel();
  fail(error);
  if (aal?.currentLevel === 'aal2') return { kind: 'ready', email, userId: user.id };

  const { data: factors, error: factorsError } = await auth.mfa.listFactors();
  fail(factorsError);
  const verified = factors?.totp.find((factor) => factor.status === 'verified');
  return verified
    ? { kind: 'needs-code', email, factorId: verified.id }
    : { kind: 'needs-enroll', email };
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase().auth.signInWithPassword({ email: email.trim(), password });
  fail(error);
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase().auth.signUp({ email: email.trim(), password });
  fail(error);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase().auth.signOut();
  fail(error);
}

export type TotpEnrollment = { factorId: string; qrSvg: string; secret: string };

export async function enrollTotp(): Promise<TotpEnrollment> {
  const auth = supabase().auth;
  // Si quedó un registro a medias, se elimina para empezar limpio.
  const { data: factors } = await auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.status === 'unverified') await auth.mfa.unenroll({ factorId: factor.id });
  }
  const { data, error } = await auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Kipo' });
  fail(error);
  if (!data || data.type !== 'totp') throw new Error('No se pudo iniciar el segundo factor');
  return { factorId: data.id, qrSvg: data.totp.qr_code, secret: data.totp.secret };
}

export async function verifyTotp(factorId: string, code: string): Promise<void> {
  const { error } = await supabase().auth.mfa.challengeAndVerify({
    factorId,
    code: code.replace(/\s/g, ''),
  });
  fail(error);
}
