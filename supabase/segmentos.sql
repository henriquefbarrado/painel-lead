-- Rode no SQL Editor do Supabase (uma vez). Reaproveita a tabela e as regras de segurança de "leads".
alter table leads add column if not exists segmento text;
alter table leads add column if not exists solucoes text[] not null default '{}';
notify pgrst, 'reload schema';
