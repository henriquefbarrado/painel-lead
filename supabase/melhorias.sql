-- Rode UMA vez no SQL Editor do Supabase (depois de schema, financeiro, segmentos e contatos).
-- Pode rodar de novo sem problema: tudo usa "if not exists".

-- ===== Leads: follow-up, motivo de perda e deduplicação =====
alter table leads add column if not exists proximo_contato date;
alter table leads add column if not exists ultimo_contato timestamptz;
alter table leads add column if not exists proxima_acao text;
alter table leads add column if not exists motivo_perda text;
alter table leads add column if not exists place_id text;
create unique index if not exists leads_place_id_uniq on leads (place_id) where place_id is not null;
create index if not exists leads_proximo_contato_idx on leads (proximo_contato) where proximo_contato is not null;

-- ===== Financeiro: vínculo com lead, categoria, pendente/recebido, recorrência =====
alter table financeiro add column if not exists lead_id uuid references leads(id) on delete set null;
alter table financeiro add column if not exists categoria text;
alter table financeiro add column if not exists situacao text not null default 'pago' check (situacao in ('pago','pendente'));
alter table financeiro add column if not exists recorrente boolean not null default false;
create index if not exists financeiro_lead_idx on financeiro (lead_id);

-- ===== Templates de mensagem editáveis =====
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  segmento text,            -- null = vale para todos os segmentos
  status text not null,     -- novo, contato_realizado, interessado, negociacao
  texto text not null,      -- variáveis: {nome_loja} {seu_nome} {responsavel} {cidade}
  created_at timestamptz not null default now()
);
alter table templates enable row level security;
drop policy if exists "usuarios autenticados" on templates;
create policy "usuarios autenticados" on templates for all to authenticated using (true) with check (true);

-- ===== Configurações compartilhadas (meta mensal etc.) =====
create table if not exists config (
  chave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);
alter table config enable row level security;
drop policy if exists "usuarios autenticados" on config;
create policy "usuarios autenticados" on config for all to authenticated using (true) with check (true);

-- ===== Uso da busca (cota do plano grátis, limite de frequência) e cache =====
create table if not exists buscas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  consulta text not null,
  qtd int not null check (qtd >= 0),   -- lojas consumidas da cota (0 quando veio do cache)
  do_cache boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists buscas_created_idx on buscas (created_at desc);
alter table buscas enable row level security;
drop policy if exists "ver buscas" on buscas;
drop policy if exists "registrar busca" on buscas;
create policy "ver buscas" on buscas for select to authenticated using (true);
create policy "registrar busca" on buscas for insert to authenticated with check (user_id = auth.uid());

create table if not exists busca_cache (
  chave text primary key,
  resultado jsonb not null,
  created_at timestamptz not null default now()
);
alter table busca_cache enable row level security;
drop policy if exists "usuarios autenticados" on busca_cache;
create policy "usuarios autenticados" on busca_cache for all to authenticated using (true) with check (true);

notify pgrst, 'reload schema';
