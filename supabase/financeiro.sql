create table financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('receita','despesa')),
  descricao text not null,
  valor numeric(12,2) not null check (valor >= 0),
  data date not null default current_date,
  created_at timestamptz not null default now()
);
alter table financeiro enable row level security;
create policy "usuarios autenticados" on financeiro for all to authenticated using (true) with check (true);
