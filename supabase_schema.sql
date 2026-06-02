-- ============================================================================
-- WX180 · Esquema Supabase para la cartera de oportunidades
-- ----------------------------------------------------------------------------
-- Este script refleja la tabla `opportunities` que YA existe en el proyecto
-- (diseño solo-JSONB) y es IDEMPOTENTE: puedes ejecutarlo sobre el proyecto
-- actual sin perder datos. Su valor principal es GARANTIZAR las políticas RLS
-- de cartera compartida para usuarios autenticados y el trigger de updated_at.
--
-- Cómo aplicarlo:
--   1. Supabase → "SQL Editor" → "New query" → pega todo → "Run".
--
-- Modelo de acceso: CARTERA COMPARTIDA CON LOGIN.
--   Cualquier usuario autenticado ve y edita todas las oportunidades.
--   El anónimo (sin sesión) no puede leer ni escribir nada.
-- ============================================================================

-- Tabla (no se recrea si ya existe). Todo el detalle del brief vive en `data`.
create table if not exists public.opportunities (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  data       jsonb not null default '{}'::jsonb
);

-- Orden habitual de la cartera: por última edición.
create index if not exists opportunities_updated_at_idx
  on public.opportunities (updated_at desc);

-- Mantener updated_at al día en cada UPDATE (el cliente también lo envía, este
-- trigger es la red de seguridad).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_opportunities_updated_at on public.opportunities;
create trigger trg_opportunities_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: nadie entra sin sesión; cualquier usuario con sesión
-- comparte toda la cartera (leer / crear / editar / borrar).
-- ---------------------------------------------------------------------------
alter table public.opportunities enable row level security;

drop policy if exists "equipo_lee"   on public.opportunities;
drop policy if exists "equipo_crea"  on public.opportunities;
drop policy if exists "equipo_edita" on public.opportunities;
drop policy if exists "equipo_borra" on public.opportunities;

create policy "equipo_lee"   on public.opportunities
  for select using (auth.role() = 'authenticated');

create policy "equipo_crea"  on public.opportunities
  for insert with check (auth.role() = 'authenticated');

create policy "equipo_edita" on public.opportunities
  for update using (auth.role() = 'authenticated')
            with check (auth.role() = 'authenticated');

create policy "equipo_borra" on public.opportunities
  for delete using (auth.role() = 'authenticated');

-- ============================================================================
-- Usuarios del equipo
-- ----------------------------------------------------------------------------
-- Recomendado para una herramienta interna: DESACTIVAR el registro abierto y
-- crear tú las cuentas a mano.
--   Authentication → Sign In / Providers → Email: activado.
--   Authentication → Sign In / Providers → "Allow new users to sign up": OFF.
--   Authentication → Users → "Add user": crea cada cuenta del equipo
--     (email + contraseña) y márcala como "Auto Confirm User".
-- La pantalla de login de index.html usa email + contraseña.
-- ============================================================================
