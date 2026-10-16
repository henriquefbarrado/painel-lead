create type lead_status as enum ('novo','contato_realizado','interessado','sem_interesse','negociacao','convertido');
create table leads (
  id uuid primary key default gen_random_uuid(),
  nome_loja text not null, responsavel text, whatsapp text, endereco text,
  cidade text, estado text, cep text, latitude double precision, longitude double precision,
  categoria text, status lead_status not null default 'novo', observacoes text,
  created_at timestamptz not null default now()
);
alter table leads enable row level security;
create policy "usuarios autenticados" on leads for all to authenticated using (true) with check (true);
