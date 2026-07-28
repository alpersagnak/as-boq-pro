-- A.S BOQ PRO v7.1 - İlişkisel Supabase tabloları
-- Supabase > SQL Editor > New query bölümünde tamamını bir kez çalıştırın.

create table if not exists public.asboq_projects (
  id text primary key,
  app_key text not null,
  name text not null,
  code text not null,
  client text not null default '',
  currency text not null default 'TRY',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists asboq_projects_app_key_idx on public.asboq_projects(app_key);

create table if not exists public.asboq_boq_items (
  id text primary key,
  app_key text not null,
  project_id text not null references public.asboq_projects(id) on delete cascade,
  poz_no text not null default '',
  description text not null default '',
  unit text not null default '',
  item_type text not null default '',
  category text not null default '',
  quantity numeric not null default 0,
  materials jsonb not null default '[]'::jsonb,
  labors jsonb not null default '[]'::jsonb,
  equipments jsonb not null default '[]'::jsonb,
  transports jsonb not null default '[]'::jsonb,
  analysis_settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists asboq_boq_items_project_idx on public.asboq_boq_items(project_id);
create index if not exists asboq_boq_items_app_key_idx on public.asboq_boq_items(app_key);

create table if not exists public.asboq_progress_payments (
  id text primary key,
  app_key text not null,
  project_id text not null references public.asboq_projects(id) on delete cascade,
  number text not null default '',
  title text not null default '',
  payment_date date,
  retention_percent numeric not null default 0,
  advance_deduction numeric not null default 0,
  other_deduction numeric not null default 0,
  vat_percent numeric not null default 0,
  notes text not null default '',
  quantities jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists asboq_progress_project_idx on public.asboq_progress_payments(project_id);
create index if not exists asboq_progress_app_key_idx on public.asboq_progress_payments(app_key);

create table if not exists public.asboq_preferences (
  app_key text primary key,
  active_project_id text,
  updated_at timestamptz not null default now()
);

alter table public.asboq_projects enable row level security;
alter table public.asboq_boq_items enable row level security;
alter table public.asboq_progress_payments enable row level security;
alter table public.asboq_preferences enable row level security;

-- Geliştirme dönemi politikaları. Giriş sistemi eklendiğinde kullanıcı/firma bazlı RLS yapılacaktır.
do $$
declare
  t text;
begin
  foreach t in array array['asboq_projects','asboq_boq_items','asboq_progress_payments','asboq_preferences']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_dev_all', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (true) with check (true)',
      t || '_dev_all', t
    );
  end loop;
end $$;
