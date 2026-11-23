-- Kipo, fase 5: permisos de tabla para usuarios con sesión.
-- Los proyectos nuevos de Supabase no conceden acceso automático a las tablas creadas por SQL,
-- así que se otorgan explícitamente. RLS (kipo_is_owner, con segundo factor) sigue decidiendo
-- QUÉ filas puede tocar cada usuario; esto solo decide QUÉ operaciones existen.
-- Sin DELETE a propósito: los borrados viajan como deleted_at.

grant usage on schema public to authenticated;

grant select, insert, update on table public.vault_keys to authenticated;
grant select, insert, update on table public.documents to authenticated;

-- El usuario anónimo no tiene nada que hacer aquí.
revoke all on table public.vault_keys, public.documents from anon;
