-- Nova etapa do funil: "Entrar em contato" (entre "Novo" e "Contato realizado").
-- Rode UMA vez no SQL Editor do Supabase, SOZINHO (sem outros comandos junto). Pode rodar de novo sem problema.
-- Quem instalou com o schema.sql antigo precisa disto; quem instala agora já recebe a etapa pelo schema.sql.
alter type lead_status add value if not exists 'entrar_em_contato' before 'contato_realizado';
