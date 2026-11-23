-- Kipo, fase 7: claves y notas seguras. Igual que documents: el servidor solo guarda
-- payload_enc (cifrado en el teléfono) y no puede leer nada.
-- Nunca editar esta migración una vez aplicada: crear una nueva.

create table public.secrets (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  payload_enc text not null check (length(payload_enc) < 200000),
  updated_at timestamptz not null,
  deleted_at timestamptz,
  server_updated_at timestamptz not null default now()
);

create index secrets_user_server_updated on public.secrets (user_id, server_updated_at);

-- Reutiliza el trigger de documents: server_updated_at siempre lo pone el servidor.
create trigger secrets_touch
before insert or update on public.secrets
for each row execute function public.kipo_touch_document();

alter table public.secrets enable row level security;

create policy "secrets: leer las propias" on public.secrets
  for select to authenticated using (public.kipo_is_owner(user_id));
create policy "secrets: crear las propias" on public.secrets
  for insert to authenticated with check (public.kipo_is_owner(user_id));
create policy "secrets: actualizar las propias" on public.secrets
  for update to authenticated
  using (public.kipo_is_owner(user_id)) with check (public.kipo_is_owner(user_id));
-- Sin DELETE: los borrados viajan como deleted_at.

grant select, insert, update on table public.secrets to authenticated;
revoke all on table public.secrets from anon;

create or replace function public.kipo_upsert_secret(
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
  insert into public.secrets as s (id, payload_enc, updated_at, deleted_at)
  values (p_id, p_payload, p_updated_at, p_deleted_at)
  on conflict (id) do update
    set payload_enc = excluded.payload_enc,
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at
    where s.updated_at < excluded.updated_at;
  return found;
end;
$$;

revoke all on function public.kipo_upsert_secret(uuid, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.kipo_upsert_secret(uuid, text, timestamptz, timestamptz) to authenticated;
