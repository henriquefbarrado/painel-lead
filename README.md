# Painel de Leads

Painel interno para organizar a prospecção comercial de lojas: cadastro de leads, mensagens de WhatsApp prontas por etapa da conversa, busca de lojas sem site na região e controle financeiro simples. Feito para uso de poucas pessoas (cada uma com seu próprio login).

## Funcionalidades

- **Login seguro** por e-mail e senha (Supabase Auth). Páginas internas protegidas: sem login, redireciona para a tela de entrada.
- **Leads**: cadastrar, editar, ver detalhes e excluir (com janela de confirmação), com busca por nome, cidade ou telefone e filtro por status.
- **Segmento e soluções**: cada lead tem um segmento (restaurante, loja, serviços, beleza, saúde, outros) e as soluções que fazem sentido para ele (cardápio digital, landing page, agendamento online etc., várias por lead), com filtro por segmento e por solução. O catálogo fica em `lib/segmentos.ts`.
- **Indicadores**: total de leads, novos, contatados e interessados.
- **Raio de distância**: escolha uma loja como referência e filtre as lojas em 1, 3, 5, 10, 20 ou 50 km (cálculo de Haversine, em linha reta). Lojas sem coordenadas aparecem como "Localização precisa ser preenchida".
- **Mensagem de WhatsApp por status**: o card mostra um texto pronto, editável, com botões **Copiar mensagem** e **WhatsApp** (abre `wa.me` com o texto preenchido). Nada é enviado automaticamente. Veja [STATUS-DOS-LEADS.md](STATUS-DOS-LEADS.md).
- **Modo envio**: fila com um lead por vez (respeitando os filtros), mensagem pronta e botão para abrir o WhatsApp. Você envia lá e volta para tocar em "Enviei, próximo"; leads Novos viram Contato realizado sozinhos. O envio continua manual.
- **Nome por login**: o nome usado nas mensagens vem do e-mail de quem está logado (`lib/usuarios.ts`).
- **Buscar lojas sem site**: pesquisa negócios por segmento e cidade/bairro (OpenWeb Ninja, grátis, ou Google Places) e mostra só os que não têm site próprio (quem só tem Instagram, Facebook ou link de WhatsApp conta como sem site). Dá para adicionar o resultado direto aos leads.
- **Financeiro**: receitas, despesas, lucro do mês, lucro total, gráfico dos últimos 6 meses e lista de lançamentos.
- **Início (dashboard)**: funil de conversão, taxa de conversão, leads por segmento, contatos dos últimos 7 dias, motivos de perda e **meta mensal** de sites fechados com barra de progresso. Botão de **backup** (JSON com leads, contatos, financeiro, templates e configurações).
- **Hoje**: quem você precisa chamar (retornos atrasados e de hoje), com botão de WhatsApp e reagendamento em um clique.
- **Pipeline (Kanban)**: arraste os leads entre Novo, Contato realizado, Interessado, Negociação, Convertido e Sem interesse. No celular use o seletor “Mover para…”.
- **Ficha do lead** (`/leads/[id]`): dados, status, follow-up (próximo contato e próxima ação), mensagem pronta, histórico de contatos/notas e receitas vinculadas.
- **Follow-up**: campo “próximo contato em”, aviso de retorno atrasado nos cards e filtro por retorno.
- **Motivo de perda**: ao marcar “Sem interesse” o sistema pergunta o motivo (aparece no dashboard).
- **Mensagens editáveis**: templates por etapa e por segmento, com variáveis `{nome_loja}`, `{seu_nome}`, `{responsavel}` e `{cidade}`. Sem template, vale o texto padrão de `lib/message-template.ts`.
- **Ações em massa** na lista de leads: selecionar vários, mudar status, exportar e excluir. Ordenação (recentes, nome, etapa, retorno, distância), paginação (“Carregar mais”) e **exportação CSV**.
- **Sem duplicados**: cadastro manual, importação e busca comparam telefone, nome+endereço e o `place_id` da busca.
- **Busca de lojas**: contador de cota do mês (500 do plano grátis), cache de 24 h (repetir a busca não gasta cota), limite de 5 buscas por minuto, estados de carregando/erro/sem resultado e prévia com seleção antes de salvar.
- **Financeiro**: receita vinculada ao lead (marca o lead como Convertido), categorias, a receber/recebido, despesas recorrentes, editar e excluir, ticket médio, conversão, custo por lead e receita por segmento.
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
  page.tsx                  Início (dashboard)
  leads/page.tsx            Lista de leads
  leads/[id]/page.tsx       Ficha do lead
  hoje/page.tsx             Retornos de hoje
  pipeline/page.tsx         Kanban
  templates/page.tsx        Mensagens editáveis
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
  FilaEnvio.tsx             Modo envio (fila de leads)
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
  melhorias.sql             Follow-up, templates, meta, cota/cache da busca, financeiro x lead
  schema.sql                Tabela de leads
  segmentos.sql             Colunas de segmento e soluções (rode depois do schema.sql)
  financeiro.sql            Tabela do financeiro
```

## Como rodar

Pré-requisito: Node.js 18 ou superior.

1. **Supabase**: crie um projeto em https://supabase.com. No **SQL Editor**, rode, nesta ordem, `supabase/schema.sql`, `supabase/financeiro.sql`, `supabase/segmentos.sql`, `supabase/contatos.sql` e **`supabase/melhorias.sql`** (follow-up, templates, meta, cota da busca, vínculo financeiro-lead). Dá para rodar o `melhorias.sql` de novo sem problema.
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
| `npm test` | Testes automáticos das regras (conversão, financeiro, templates, duplicados, CSV, cache) |
| `npm run typecheck` | Confere os tipos do TypeScript |

## Publicar na Vercel

1. Suba o repositório no GitHub (o `.env.local` fica de fora pelo `.gitignore`).
2. Na Vercel, importe o repositório e, em **Settings > Environment Variables**, cadastre as variáveis da tabela acima em **Production**.
3. A cada `git push` na `main` o deploy acontece sozinho.

Pelo terminal: `npm i -g vercel`, `vercel login`, `vercel link` (uma vez) e `vercel --prod` para publicar. Mudar algo no Supabase (tabelas, usuários, dados) **não** exige novo deploy. Mudar o código ou as variáveis de ambiente, sim.

## Segurança

- Nenhuma senha ou chave fica no código. O `.env.local` nunca vai para o Git.
- O `.env.example` deve conter **apenas os nomes das variáveis, sem valores**.
- Use somente a chave *publishable* (ou *anon*) do Supabase no projeto. Nunca use a chave *secret* ou *service_role*.
- As tabelas têm RLS ativado, e só usuários autenticados leem ou escrevem. Todos os usuários logados veem todos os dados (de propósito: o painel é para uma equipe pequena que compartilha a carteira de leads). Se um dia precisar de dados separados por usuário, adicione `user_id` às tabelas e troque as políticas por `using (user_id = auth.uid())`.
- A rota `/api/buscar-lojas` confere o login no servidor, aplica cota mensal, cache e limite de frequência. A chave da busca nunca vai para o navegador.
- A chave do Google fica só no servidor (rota `/api/buscar-lojas`) e deve ser restrita à Places API (New). Configure um alerta de orçamento e um limite diário de requisições no Google Cloud.

## Como personalizar

- **Textos das mensagens**: `lib/message-template.ts` (objeto `MESSAGES`).
- **Nomes por e-mail**: `lib/usuarios.ts`.
- **Cores e botões**: `app/globals.css` e as classes do Tailwind nos componentes.

## Ideias para o futuro

Geocodificação automática pelo endereço, lembretes por e-mail/push dos retornos do dia e permissões diferentes por usuário.
