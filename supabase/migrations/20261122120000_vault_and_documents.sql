-- Kipo, fase 5: respaldo cifrado. El servidor solo guarda datos que no puede leer:
-- la DEK envuelta (sin la contraseña maestra no sirve) y los documentos cifrados en el teléfono.
-- Nunca editar esta migración una vez aplicada: crear una nueva.

-- Dueño de la fila y sesión con segundo factor (aal2). Todas las políticas la usan.
create or replace function public.kipo_is_owner(owner uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select owner = auth.uid() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Bóveda: los mismos datos que el registro local de src/crypto/vault.ts.
create table public.vault_keys (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  wrapped_dek text not null check (length(wrapped_dek) < 1000),         -- DEK envuelta con la KEK
  wrapped_dek_recovery text not null check (length(wrapped_dek_recovery) < 1000),
  kdf_salt text not null check (length(kdf_salt) < 100),
  kdf_params jsonb not null,            -- { alg, memoryKiB, passes, parallelism }
  updated_at timestamptz not null default now()
);

-- Documentos: todo el contenido va en payload_enc (título, ubicación, notas, OCR y la lista
-- de páginas). El servidor ni siquiera sabe cuántas páginas tiene cada documento.
create table public.documents (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  payload_enc text not null check (length(payload_enc) < 2000000),
  updated_at timestamptz not null,          -- reloj del teléfono: decide los conflictos
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()  -- reloj del servidor: cursor de descarga
);

create index documents_user_server_updated on public.documents (user_id, server_updated_at);

-- server_updated_at siempre lo pone el servidor (el teléfono no puede adelantarlo ni atrasarlo).
create or replace function public.kipo_touch_document()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
  return new;
end;
$$;

create trigger documents_touch
before insert or update on public.documents
for each row execute function public.kipo_touch_document();

create or replace function public.kipo_touch_vault()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger vault_keys_touch
before update on public.vault_keys
for each row execute function public.kipo_touch_vault();

-- RLS: cada usuario solo ve y edita sus filas, y solo con segundo factor.
alter table public.vault_keys enable row level security;
alter table public.documents enable row level security;

create policy "vault_keys: leer las propias" on public.vault_keys
  for select to authenticated using (public.kipo_is_owner(user_id));
create policy "vault_keys: crear la propia" on public.vault_keys
  for insert to authenticated with check (public.kipo_is_owner(user_id));
create policy "vault_keys: actualizar la propia" on public.vault_keys
  for update to authenticated
  using (public.kipo_is_owner(user_id)) with check (public.kipo_is_owner(user_id));

create policy "documents: leer los propios" on public.documents
  for select to authenticated using (public.kipo_is_owner(user_id));
create policy "documents: crear los propios" on public.documents
  for insert to authenticated with check (public.kipo_is_owner(user_id));
create policy "documents: actualizar los propios" on public.documents
  for update to authenticated
  using (public.kipo_is_owner(user_id)) with check (public.kipo_is_owner(user_id));
-- Sin política de DELETE: los borrados viajan como deleted_at (borrado lógico).

revoke all on public.vault_keys, public.documents from anon;

-- Subir un documento con "gana el updated_at más reciente", en un solo paso.
-- Devuelve true si se aplicó y false si en la nube ya había una versión más nueva.
-- security invoker: respeta RLS, así que nadie puede escribir filas de otro usuario.
create or replace function public.kipo_upsert_document(
  p_id uuid,
  p_payload text,
  p_updated_at timestamptz,
  p_deleted_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.documents as d (id, payload_enc, updated_at, deleted_at)
  values (p_id, p_payload, p_updated_at, p_deleted_at)
  on conflict (id) do update
    set payload_enc = excluded.payload_enc,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    where d.updated_at < excluded.updated_at;
  return found;
end;
$$;

revoke all on function public.kipo_upsert_document(uuid, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.kipo_upsert_document(uuid, text, timestamptz, timestamptz) to authenticated;
