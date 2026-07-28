-- A.S BOQ PRO - Supabase bulut senkronizasyon tablosu
-- Supabase > SQL Editor bölümünde bir kez çalıştırın.

create table if not exists public.asboq_app_state (
  app_key text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.asboq_app_state enable row level security;

-- GELİŞTİRME POLİTİKASI: anon anahtarıyla okuma/yazma sağlar.
-- Kullanıcı giriş sistemi eklendiğinde bu politikaları user_id bazlı hale getirin.
drop policy if exists "asboq_dev_select" on public.asboq_app_state;
create policy "asboq_dev_select"
on public.asboq_app_state for select
to anon, authenticated
using (true);

drop policy if exists "asboq_dev_insert" on public.asboq_app_state;
create policy "asboq_dev_insert"
on public.asboq_app_state for insert
to anon, authenticated
with check (true);

drop policy if exists "asboq_dev_update" on public.asboq_app_state;
create policy "asboq_dev_update"
on public.asboq_app_state for update
to anon, authenticated
using (true)
with check (true);
