-- Logs das buscas de lojas. Rode UMA vez no SQL Editor (pode rodar de novo sem problema).
-- Só o e-mail do administrador consegue LER os logs; qualquer usuário logado consegue gravar o próprio.
create table if not exists logs_busca (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users(id),
  usuario text,                     -- e-mail de quem buscou
  segmento text not null,
  local text not null,
  qtd_pedida int,
  resultados int,                   -- lojas devolvidas pela busca
  sem_site int,                     -- quantas delas não têm site
  cota_gasta int not null default 0,
  do_cache boolean not null default false,
  erro text
);
create index if not exists logs_busca_created_idx on logs_busca (created_at desc);
alter table logs_busca enable row level security;
drop policy if exists "registrar log" on logs_busca;
drop policy if exists "so o admin ve os logs" on logs_busca;
create policy "registrar log" on logs_busca for insert to authenticated with check (user_id = auth.uid());
create policy "so o admin ve os logs" on logs_busca for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'rick.fb4@gmail.com');

-- Traz o histórico de buscas que já existia (só na primeira vez, enquanto a tabela estiver vazia)
insert into logs_busca (user_id, usuario, segmento, local, qtd_pedida, cota_gasta, do_cache, created_at)
select b.user_id, u.email, split_part(b.consulta, '|', 1), split_part(b.consulta, '|', 2),
       nullif(split_part(b.consulta, '|', 3), '')::int, b.qtd, b.do_cache, b.created_at
from buscas b left join auth.users u on u.id = b.user_id
where not exists (select 1 from logs_busca);

notify pgrst, 'reload schema';
select count(*) as logs_gravados from logs_busca;
