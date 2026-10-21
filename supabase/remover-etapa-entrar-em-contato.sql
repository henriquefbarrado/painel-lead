-- Migração de dados: a coluna 'Entrar em contato' foi removida do funil.
-- Rode UMA vez no SQL Editor do Supabase para devolver os leads dessa etapa a 'Novo'.
-- O status antigo pode continuar registrado no tipo enum do banco, mas o painel não o utiliza.
update public.leads
set status = 'novo'
where status::text = 'entrar_em_contato';
