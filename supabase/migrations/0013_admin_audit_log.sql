-- 0013 — admin_audit_log table + log_admin_action RPC
--
-- Registra acciones sensibles del panel de admin (suspender usuarios,
-- borrar reseñas, cambiar rol, etc.). Tabla append-only: sólo se inserta
-- vía la función SECURITY DEFINER `log_admin_action()`, que valida que el
-- caller sea admin antes de escribir. Admin es el único que puede leer.
--
-- No hay policy de INSERT/UPDATE/DELETE — RLS con "no policy" deniega
-- todo por default. La única vía de escritura es la función.

create table public.admin_audit_log (
  id          bigserial primary key,
  admin_id    uuid not null references public.profiles(id) on delete restrict,
  action      text not null,                       -- 'suspend_user', 'delete_review', ...
  target_type text not null,                       -- 'profile', 'review', 'professional'
  target_id   text,                                -- uuid o id numérico del target
  metadata    jsonb not null default '{}'::jsonb,  -- contexto libre
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz not null default now()
);

create index admin_audit_log_admin_idx
  on public.admin_audit_log (admin_id, created_at desc);

create index admin_audit_log_target_idx
  on public.admin_audit_log (target_type, target_id);

alter table public.admin_audit_log enable row level security;

-- SELECT: sólo admin. Sin policies de INSERT/UPDATE/DELETE → denegado por default.
create policy "admin_audit_log_select_admin"
  on public.admin_audit_log for select
  using (public.is_admin());

-- =============================================================================
-- Función para registrar una acción de admin.
-- SECURITY DEFINER para poder insertar aunque el cliente tenga RLS estricto.
-- Internamente valida que auth.uid() sea admin: sin esa verificación, un
-- cliente podría llamar la función y escribir filas falsas.
-- =============================================================================

create or replace function public.log_admin_action(
  p_action      text,
  p_target_type text,
  p_target_id   text  default null,
  p_metadata    jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not public.is_admin() then
    raise exception 'forbidden: caller is not admin'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  insert into public.admin_audit_log (admin_id, action, target_type, target_id, metadata)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_metadata)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_admin_action(text, text, text, jsonb) to authenticated;
