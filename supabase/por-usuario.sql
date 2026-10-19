-- Separa os leads por usuário. Rode UMA vez no SQL Editor do Supabase,
-- DEPOIS de schema, financeiro, segmentos, contatos e melhorias. Pode rodar de novo sem problema.

-- 1) Dono do lead: preenchido sozinho com o usuário logado em cada novo lead (cadastro, importação e busca)
alter table leads add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2) Leads que já existem ficam com o Rick (troque o e-mail se quiser outro dono)
update leads set user_id = (select id from auth.users where lower(email) = 'rick.fb4@gmail.com') where user_id is null;

-- 3) O mesmo estabelecimento (place_id) pode existir na carteira de cada usuário
drop index if exists leads_place_id_uniq;
create unique index if not exists leads_user_place_id_uniq on leads (user_id, place_id) where place_id is not null;
create index if not exists leads_user_idx on leads (user_id);

-- 4) Regra de acesso dos leads: cada um vê, edita e exclui só os seus
drop policy if exists "usuarios autenticados" on leads;
drop policy if exists "cada usuario ve os seus leads" on leads;
create policy "cada usuario ve os seus leads" on leads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 5) Histórico de contato acompanha o lead: só aparece (e só se registra) em leads que você enxerga
drop policy if exists "ver contatos" on contatos;
create policy "ver contatos" on contatos for select to authenticated
  using (exists (select 1 from leads l where l.id = contatos.lead_id));
drop policy if exists "registrar contato" on contatos;
create policy "registrar contato" on contatos for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from leads l where l.id = contatos.lead_id));

notify pgrst, 'reload schema';

-- 6) Conferência: tem que mostrar 0 (lead sem dono fica invisível para todos)
select count(*) as leads_sem_dono from leads where user_id is null;
