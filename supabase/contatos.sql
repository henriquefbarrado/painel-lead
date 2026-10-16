-- Histórico de contato por lead. Cada registro guarda quem fez o contato.
-- Rode este arquivo uma vez no SQL Editor do Supabase.
create table contatos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id),
  user_nome text not null,
  user_email text,
  tipo text not null check (tipo in ('whatsapp','ligacao','email','visita','reuniao','outro')),
  nota text,
  contatado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index contatos_lead_idx on contatos (lead_id, contatado_em desc);
alter table contatos enable row level security;
create policy "ver contatos" on contatos for select to authenticated using (true);
create policy "registrar contato" on contatos for insert to authenticated with check (user_id = auth.uid());
create policy "apagar proprio contato" on contatos for delete to authenticated using (user_id = auth.uid());
