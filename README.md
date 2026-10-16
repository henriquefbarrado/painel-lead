# Painel de Leads

Painel interno para organizar a prospecção comercial de lojas: cadastro de leads, mensagens de WhatsApp prontas por etapa da conversa, busca de lojas sem site na região e controle financeiro simples. Feito para uso de poucas pessoas (cada uma com seu próprio login).

## Funcionalidades

- **Login seguro** por e-mail e senha (Supabase Auth). Páginas internas protegidas: sem login, redireciona para a tela de entrada.
- **Leads**: cadastrar, editar, ver detalhes e excluir (com janela de confirmação), com busca por nome, cidade ou telefone e filtro por status.
- **Segmento e soluções**: cada lead tem um segmento (restaurante, loja, serviços, beleza, saúde, outros) e as soluções que fazem sentido para ele (cardápio digital, landing page, agendamento online etc., várias por lead), com filtro por segmento e por solução. O catálogo fica em `lib/segmentos.ts`.
- **Indicadores**: total de leads, novos, contatados e interessados.
- **Raio de distância**: escolha uma loja como referência e filtre as lojas em 1, 3, 5, 10, 20 ou 50 km (cálculo de Haversine, em linha reta). Lojas sem coordenadas aparecem como "Localização precisa ser preenchida".
- **Mensagem de WhatsApp por status**: o card mostra um texto pronto, editável, com botões **Copiar mensagem** e **WhatsApp** (abre `wa.me` com o texto preenchido). Nada é enviado automaticamente. Veja [STATUS-DOS-LEADS.md](STATUS-DOS-LEADS.md).
- **Nome por login**: o nome usado nas mensagens vem do e-mail de quem está logado (`lib/usuarios.ts`).
- **Buscar lojas sem site**: pesquisa negócios por segmento e cidade/bairro (OpenWeb Ninja, grátis, ou Google Places) e mostra só os que não têm site próprio (quem só tem Instagram, Facebook ou link de WhatsApp conta como sem site). Dá para adicionar o resultado direto aos leads.
- **Financeiro**: receitas, despesas, lucro do mês, lucro total, gráfico dos últimos 6 meses e lista de lançamentos.
- **Tema escuro (padrão) e claro**, com botão no menu. Layout responsivo para computador e celular.

## Tecnologias

- [Next.js 14](https://nextjs.org) (App Router) e React 18, em TypeScript
- [Tailwind CSS](https://tailwindcss.com) e [lucide-react](https://lucide.dev) (ícones)
- [Supabase](https://supabase.com): banco Postgres, autenticação e regras de segurança (RLS)
- OpenWeb Ninja ou Google Places API (New): busca de lojas (opcional)
- Hospedagem: [Vercel](https://vercel.com)

## Estrutura do projeto

```
app/
  page.tsx                  Leads (página inicial, protegida)
  buscar/page.tsx           Buscar lojas sem site
  financeiro/page.tsx       Financeiro
  login/page.tsx            Tela de login
  api/buscar-lojas/route.ts Rota de servidor que consulta o Google Places
components/
  Shell.tsx                 Menu lateral, tema claro/escuro, usuário logado
  Painel.tsx                Dashboard, filtros, busca e lista de leads
  LeadCard.tsx              Card da loja e mensagem de WhatsApp
  LeadForm.tsx              Formulário de cadastro e edição
  BuscarLojas.tsx           Tela de busca de lojas
  Financeiro.tsx            Tela financeira
  ConfirmDialog.tsx         Janela de confirmação de exclusão
  PageHeader.tsx            Cabeçalho das páginas
lib/
  message-template.ts       Mensagens por status e formatação do número de WhatsApp
  usuarios.ts               Nome de cada usuário, pelo e-mail
  useUsuario.ts             Hook que devolve o usuário logado
  geo.ts                    Cálculo de distância
  types.ts                  Tipos e status dos leads
  supabase/client.ts        Conexão com o Supabase no navegador
middleware.ts               Bloqueia páginas para quem não está logado
supabase/
  schema.sql                Tabela de leads
  segmentos.sql             Colunas de segmento e soluções (rode depois do schema.sql)
  financeiro.sql            Tabela do financeiro
```

## Como rodar

Pré-requisito: Node.js 18 ou superior.

1. **Supabase**: crie um projeto em https://supabase.com. No **SQL Editor**, rode `supabase/schema.sql`, `supabase/financeiro.sql` e `supabase/segmentos.sql`.
2. **Usuários**: em **Authentication > Users**, crie cada pessoa (marque *Auto Confirm User*). Desative o cadastro público em **Authentication > Providers > Email** (*Allow new users to sign up*).
3. **Variáveis de ambiente**: copie o modelo e preencha.
   ```
   cp .env.example .env.local        # no PowerShell: Copy-Item .env.example .env.local
   ```
   | Variável | Obrigatória | Onde pegar |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Sim | Supabase: Project Settings > Data API (só o endereço base, `https://xxxx.supabase.co`) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Sim | Supabase: Project Settings > API Keys (chave *publishable*; `NEXT_PUBLIC_SUPABASE_ANON_KEY` também é aceita) |
   | `OPENWEBNINJA_API_KEY` | Só para a busca de lojas | Cadastro grátis em https://app.openwebninja.com/signup (500 lojas por mês, sem cartão). Tem prioridade sobre o Google |
   | `GOOGLE_MAPS_API_KEY` | Alternativa para a busca de lojas | Google Cloud: ative a *Places API (New)*, com faturamento, e crie uma chave de API |
4. **Instalar e iniciar**:
   ```
   npm install
   npm run dev
   ```
   Abra http://localhost:3000 e entre com um dos usuários criados.

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Modo de desenvolvimento (atualiza ao salvar) |
| `npm run build` | Gera a versão de produção |
| `npm start` | Serve a versão de produção (rode o `build` antes) |
| `npm run prod` | `build` e `start` em sequência (mais rápido para uso diário) |

## Publicar na Vercel

1. Suba o repositório no GitHub (o `.env.local` fica de fora pelo `.gitignore`).
2. Na Vercel, importe o repositório e, em **Settings > Environment Variables**, cadastre as variáveis da tabela acima em **Production**.
3. A cada `git push` na `main` o deploy acontece sozinho.

Pelo terminal: `npm i -g vercel`, `vercel login`, `vercel link` (uma vez) e `vercel --prod` para publicar. Mudar algo no Supabase (tabelas, usuários, dados) **não** exige novo deploy. Mudar o código ou as variáveis de ambiente, sim.

## Segurança

- Nenhuma senha ou chave fica no código. O `.env.local` nunca vai para o Git.
- O `.env.example` deve conter **apenas os nomes das variáveis, sem valores**.
- Use somente a chave *publishable* (ou *anon*) do Supabase no projeto. Nunca use a chave *secret* ou *service_role*.
- As tabelas têm RLS ativado, e só usuários autenticados leem ou escrevem. Todos os usuários logados veem todos os dados.
- A chave do Google fica só no servidor (rota `/api/buscar-lojas`) e deve ser restrita à Places API (New). Configure um alerta de orçamento e um limite diário de requisições no Google Cloud.

## Como personalizar

- **Textos das mensagens**: `lib/message-template.ts` (objeto `MESSAGES`).
- **Nomes por e-mail**: `lib/usuarios.ts`.
- **Cores e botões**: `app/globals.css` e as classes do Tailwind nos componentes.

## Ideias para o futuro

Importação de leads por planilha (CSV ou Excel), geocodificação automática pelo endereço, mapa interativo, histórico de contatos por lead e permissões diferentes por usuário.
