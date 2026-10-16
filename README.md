# Painel de Leads — MVP
1. Supabase: crie o projeto, rode `supabase/schema.sql` no SQL Editor.
2. Authentication > Users > Add user (você e o sócio). Providers > Email > desative "Allow new users to sign up".
3. `cp .env.example .env.local` e preencha URL e anon key (Project Settings > API).
4. `npm install && npm run dev` -> http://localhost:3000
5. Deploy: suba no GitHub, importe na Vercel e adicione as 2 variáveis de ambiente.

## Novidades
- Financeiro: rode `supabase/financeiro.sql` no SQL Editor.
- Buscar lojas sem site: adicione `GOOGLE_MAPS_API_KEY=...` no `.env.local` (chave do Google Cloud com Places API (New)).
