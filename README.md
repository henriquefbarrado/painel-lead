<div align="center">

# 🏪 Painel de Leads

### Encontre lojas sem site, chame no WhatsApp e feche o negócio — tudo num lugar só. 🚀

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![Tema](https://img.shields.io/badge/tema-claro%20%2B%20escuro-6366f1)

**Prospecção ➜ Mensagem ➜ Follow-up ➜ Venda ➜ Financeiro**

[🧭 Telas](#-telas) · [🎯 Funil](#-o-funil) · [⚡ Começar](#-começar-em-5-passos) · [🔐 Segurança](#-segurança) · [🛠️ Personalizar](#️-personalizar)

</div>

---

## ✨ O que é isso?

Um painel interno para quem vende **sites e páginas** para negócios locais. Ele cuida da rotina inteira de prospecção:

> 🔎 acha a loja ➜ 📋 cadastra o lead ➜ 💬 abre o WhatsApp com a mensagem pronta ➜ ⏰ lembra de cobrar o retorno ➜ 🤝 registra a venda ➜ 💰 lança no financeiro

Feito para poucas pessoas, **cada uma com o seu login** e os seus próprios leads. Nada é enviado sozinho: você sempre aperta o botão. 😉

---

## 🧭 Telas

| Rota | O que tem lá |
|---|---|
| 🏠 `/` | **Início**: funil, taxa de conversão, leads por segmento, contatos dos últimos 7 dias, motivos de perda, **meta mensal** e **backup em JSON** |
| 📆 `/hoje` | **Quem chamar agora**: retornos atrasados e de hoje, com WhatsApp e reagendamento em 1 clique |
| 👥 `/leads` | Lista completa com busca, filtros, ordenação, ações em massa, **modo envio** e exportação CSV |
| 🪪 `/leads/[id]` | **Ficha do lead**: dados, status, follow-up, mensagem pronta, histórico de contatos e receitas vinculadas |
| 🗂️ `/pipeline` | **Kanban** com arrastar e soltar (no celular: “Mover para…”) |
| 🔎 `/buscar` | **Buscar lojas sem site** por segmento e cidade/bairro |
| 📥 `/importar` | Importar leads de planilha (CSV ou Excel) com mapeamento de colunas |
| 💬 `/templates` | **Mensagens editáveis** por etapa e por segmento |
| 💰 `/financeiro` | Receitas, despesas, lucro, a receber e **preços das soluções** |
| 📜 `/logs` | Histórico das buscas de lojas (**só administrador**) |
| 🔑 `/login` | Entrada com e-mail e senha |

---

## 🎯 O funil

O fluxo é direto: envie a mensagem padrão enquanto o lead estiver em **Novo** e, depois de enviar, mova-o para **Contato realizado**. As outras etapas organizam o andamento da negociação; não geram mensagens automáticas diferentes.

```
Novo → Contato realizado → Interessado → Negociação → Convertido
  └────────────── qualquer etapa ──────────────→ Sem interesse
```

| Etapa | Significado | Mensagem padrão? |
|---|---|---|
| 🆕 **Novo** | Cadastrado, primeira mensagem ainda não enviada | ✅ primeiro contato |
| 💬 **Contato realizado** | Primeira mensagem enviada | ➖ status/etiqueta |
| 🔥 **Interessado** | Respondeu e demonstrou interesse | ➖ status/etiqueta |
| 🤝 **Negociação** | Proposta enviada, em fase de decisão | ➖ status/etiqueta |
| 🎉 **Convertido** | Fechou negócio | ➖ status/etiqueta |
| 🚫 **Sem interesse** | Recusou ou não é o perfil | ➖ status/etiqueta |

📖 Detalhes e rotina sugerida em [STATUS-DOS-LEADS.md](STATUS-DOS-LEADS.md).

---

## 🧰 Funcionalidades

### 💬 Mensagens e contato
- 📝 Mensagem padrão de primeiro contato em **Novo**, com WhatsApp já preenchido e opção de copiar
- 🧩 Personalização automática da mensagem padrão com o nome da loja e o nome de quem está logado
- 🏃 **Modo envio**: uma loja por vez, mensagem pronta, “Enviei, próximo” e o status avança sozinho
- 📒 **Histórico de contatos** e notas na ficha do lead

### ⏰ Follow-up
- 📅 **Próximo contato** e **próxima ação** em cada lead
- 🔴 Aviso de retorno atrasado nos cards e na tela **Hoje**
- ⚡ Reagendar em 1 clique: amanhã, 3 dias, 1 semana
- 🙅 **Motivo da perda** ao marcar “Sem interesse”, que aparece no Início

### 🔎 Captação
- 🏬 Busca lojas **sem site próprio** (quem só tem Instagram, Facebook ou link de WhatsApp conta como sem site) via OpenWeb Ninja (grátis) ou Google Places
- 📊 Contador de **cota mensal** (500 no plano grátis), **cache de 24 h** e limite de 5 buscas por minuto
- 👀 Prévia com seleção antes de salvar
- 📍 **Raio de distância** (1 a 50 km) a partir de uma loja de referência
- 🧹 **Sem duplicados**: compara telefone, nome + endereço e `place_id`

### 🗂️ Organização
- 🏷️ **Segmento e soluções** por lead (cardápio digital, landing page, agendamento online etc.), catálogo em `lib/segmentos.ts`
- ✅ **Ações em massa**: mudar status, exportar e excluir
- ↕️ Ordenação por recentes, nome, etapa, retorno ou distância
- 📤 Exportação **CSV** pronta para o Excel

### 💰 Financeiro
- 🤖 **Venda automática**: ao marcar **Convertido**, a receita é lançada sozinha (valor das soluções cadastradas em *Preços das soluções*) como “a receber”. Sem preço cadastrado, abre uma janela pedindo o valor. Nunca duplica.
- 🔗 Receita vinculada ao lead
- 🧾 Categorias, **a receber / recebido**, despesas recorrentes, editar e excluir
- 📈 Lucro do mês, lucro total, gráfico de 6 meses, ticket médio, **custo por lead** e receita por segmento

### 🎨 Experiência
- 🌗 **Tema escuro (padrão) e claro**, e o menu lateral acompanha o tema
- 📱 Layout responsivo, com barra de navegação inferior no celular
- ⌨️ **Paleta de comandos** (`Ctrl + K`) para ir a qualquer tela ou lead
- 🔐 Login seguro com Supabase Auth e páginas protegidas

---

## 🧱 Tecnologias

| | |
|---|---|
| ⚛️ **Front** | [Next.js 14](https://nextjs.org) (App Router), React 18, TypeScript |
| 🎨 **Visual** | [Tailwind CSS](https://tailwindcss.com) + [lucide-react](https://lucide.dev) |
| 🗄️ **Backend** | [Supabase](https://supabase.com): Postgres, Auth e RLS |
| 🔎 **Busca de lojas** | OpenWeb Ninja ou Google Places API (New), opcional |
| ☁️ **Hospedagem** | [Vercel](https://vercel.com) |

---

## ⚡ Começar em 5 passos

> Pré-requisito: **Node.js 18+** 🟢

**1️⃣ Banco de dados (Supabase)**
Crie um projeto em [supabase.com](https://supabase.com) e, no **SQL Editor**, rode **nesta ordem**:

```
1. supabase/schema.sql
2. supabase/financeiro.sql
3. supabase/segmentos.sql
4. supabase/contatos.sql
5. supabase/melhorias.sql             (pode rodar de novo sem problema)
6. supabase/por-usuario.sql           (cada usuário vê só os próprios leads)
7. supabase/logs-busca.sql            (logs de busca, só administrador)
```

> 💡 Se você já tem registros na antiga etapa **Entrar em contato**, rode uma vez `supabase/remover-etapa-entrar-em-contato.sql` para movê-los para **Novo**.

**2️⃣ Usuários**
Em **Authentication > Users**, crie cada pessoa (marque *Auto Confirm User*). Depois desative o cadastro público em **Authentication > Providers > Email** (*Allow new users to sign up*).

**3️⃣ Variáveis de ambiente**

```bash
cp .env.example .env.local        # PowerShell: Copy-Item .env.example .env.local
```

| Variável | Precisa? | Onde pegar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sim | Supabase: *Project Settings > Data API* (só o endereço base, `https://xxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Sim | Supabase: *Project Settings > API Keys* (chave *publishable*; `NEXT_PUBLIC_SUPABASE_ANON_KEY` também funciona) |
| `OPENWEBNINJA_API_KEY` | 🔎 Para buscar lojas | [Cadastro grátis](https://app.openwebninja.com/signup): 500 lojas por mês, sem cartão. Tem prioridade sobre o Google |
| `GOOGLE_MAPS_API_KEY` | 🔎 Alternativa | Google Cloud: ative a *Places API (New)*, com faturamento, e crie uma chave |

**4️⃣ Instalar e rodar**

```bash
npm install
npm run dev
```

**5️⃣ Abrir** 👉 http://localhost:3000 e entrar com um dos usuários criados. Pronto! 🎉

### 📜 Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | 🔥 Desenvolvimento (atualiza ao salvar) |
| `npm run build` | 📦 Gera a versão de produção |
| `npm start` | ▶️ Serve a versão de produção (rode o `build` antes) |
| `npm run prod` | ⚡ `build` + `start` em sequência |
| `npm test` | 🧪 Testes das regras (conversão, financeiro, templates, duplicados, CSV, cache) |
| `npm run typecheck` | 🔍 Confere os tipos do TypeScript |

---

## ☁️ Publicar na Vercel

1. 📤 Suba o repositório no GitHub (o `.env.local` fica de fora pelo `.gitignore`).
2. 🔧 Na Vercel, importe o repositório e cadastre as variáveis da tabela acima em **Settings > Environment Variables** (**Production**).
3. 🤖 A cada `git push` na `main`, o deploy acontece sozinho.

Pelo terminal: `npm i -g vercel`, `vercel login`, `vercel link` (uma vez) e `vercel --prod`.

> ℹ️ Mudar algo no **Supabase** (tabelas, usuários, dados) **não** exige novo deploy. Mudar o **código** ou as **variáveis de ambiente**, sim.

---

## 🔄 Enviando alterações sem dor de cabeça

O erro `rejected (non-fast-forward)` acontece quando o GitHub tem commits que a sua pasta não tem. Para evitar, **traga o que está lá antes de enviar**:

```bash
git add .
git commit -m "o que você mudou"
git pull --rebase origin main
git push
```

Ou use o atalho do projeto, que faz tudo isso de uma vez (Windows / PowerShell):

```powershell
.\enviar.ps1 "o que você mudou"
```

⚠️ **Nunca** copie a pasta `.git` de um zip por cima da sua. Isso volta o histórico no tempo e causa o erro de novo.

---

## 🔐 Segurança

- 🙈 Nenhuma senha ou chave fica no código. O `.env.local` nunca vai para o Git, e o `.env.example` tem **só os nomes** das variáveis.
- 🔑 Use somente a chave **publishable** (ou *anon*) do Supabase. **Nunca** a *secret* ou *service_role*.
- 🛡️ **RLS ativado** em todas as tabelas. **Leads são por usuário** (`supabase/por-usuario.sql`): cada pessoa vê, edita e exclui só os que criou, e o histórico de contato acompanha o lead. Financeiro, templates, meta e cota da busca são compartilhados entre os usuários logados.
- 🚦 A rota `/api/buscar-lojas` confere o login **no servidor**, aplica cota mensal, cache e limite de frequência. A chave da busca nunca vai para o navegador.
- 💸 Restrinja a chave do Google à *Places API (New)* e configure alerta de orçamento e limite diário no Google Cloud.
- 👮 Os **logs de busca** só aparecem para o administrador definido em `lib/usuarios.ts`, e também são protegidos no banco (`supabase/logs-busca.sql`).

---

## 🛠️ Personalizar

| Quero mudar… | Onde |
|---|---|
| ✍️ Textos das mensagens | `lib/message-template.ts` (objeto `MESSAGES`) ou a tela **Mensagens** |
| 🏷️ Nome e cor das etapas | `lib/types.ts` |
| 👤 Nome de cada usuário e o administrador | `lib/usuarios.ts` |
| 🏭 Segmentos e soluções | `lib/segmentos.ts` |
| 🎨 Cores do tema e da barra lateral | `app/globals.css` (variáveis `--bg`, `--surface`, `--nav-*`…) |

---

## 🗺️ Estrutura

<details>
<summary>📂 Clique para ver as pastas</summary>

```
app/                        Páginas (Next.js App Router)
  page.tsx                  Início (dashboard)
  hoje/ leads/ pipeline/    Retornos, lista, ficha e Kanban
  buscar/ importar/         Captação de leads
  templates/ financeiro/    Mensagens e finanças
  logs/ login/              Logs (admin) e entrada
  api/buscar-lojas/         Rota de servidor da busca de lojas
components/                 Shell (menu), Painel, Pipeline, LeadCard, Financeiro, VendaDialog…
lib/                        Regras e utilidades
  types.ts                  Status, cores e ordem do funil
  message-template.ts       Mensagens por etapa e número do WhatsApp
  metricas.ts               Conversão, follow-up e cálculos financeiros
  vendas.ts · precos.ts     Venda automática e preços das soluções
  segmentos.ts · geo.ts     Catálogo de segmentos e distância (Haversine)
  usuarios.ts               Nome por e-mail e administrador
supabase/                   Scripts SQL (rode na ordem do passo 1)
tests/                      Testes automáticos das regras
middleware.ts               Bloqueia páginas para quem não está logado
```

</details>

---

## 🔮 Próximos passos

- [ ] 📍 Geocodificação automática pelo endereço
- [ ] 🔔 Lembretes por e-mail ou push dos retornos do dia
- [ ] 👥 Permissões diferentes por usuário

---

<div align="center">

Feito com ☕ e muita prospecção.

**Boas vendas!** 💸🎉

</div>
