<div align="center">

# 🚀 Painel de Leads — Pacote de Melhorias

**De lista de contatos para um CRM de prospecção completo.**
Pipeline, follow-up, mensagens por segmento, cota da busca e financeiro ligado aos leads.

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)
![Testes](https://img.shields.io/badge/testes-12%20passando-brightgreen)

</div>

---

## ✨ Resumo

Este pacote aplica a revisão de produto feita sobre as telas de **Leads**, **Buscar lojas** e **Financeiro**. Antes de mexer, o código foi lido por inteiro: parte do que a revisão pedia **já existia** (WhatsApp, 6 status, importador, mapa, histórico), então o trabalho se concentrou no que **faltava** e no que **estava quebrado**.

| | Antes | Depois |
|---|---|---|
| Página inicial | Lista de leads | **Dashboard** com funil, meta e conversão |
| Funil | Cards em lista | **Kanban** com arrastar e soltar |
| Follow-up | Não existia | **Próximo contato**, tela **Hoje** e alertas de atraso |
| Mensagens | Texto fixo no código | **Templates editáveis** por etapa e segmento |
| Busca de lojas | Sem controle de uso | **Cota**, **cache** e **limite de frequência** |
| Financeiro | Texto solto | **Receita ligada ao lead**, categorias, a receber, recorrentes |
| Celular | Menu hambúrguer | **Barra de navegação inferior** |

---

## 🧭 Novas telas

| Rota | O que faz |
|---|---|
| `/` | **Início**: funil, conversão, leads por segmento, contatos dos últimos 7 dias, motivos de perda, **meta mensal** e **backup JSON** |
| `/hoje` | Quem chamar agora: retornos **atrasados** e **de hoje**, com WhatsApp e reagendamento em 1 clique |
| `/leads` | Lista de leads (a antiga home), agora com ordenação, paginação e ações em massa |
| `/leads/[id]` | **Ficha do lead**: dados, status, follow-up, mensagem pronta, histórico/notas e receitas vinculadas |
| `/pipeline` | **Kanban** com as 6 etapas; no celular usa o seletor "Mover para…" |
| `/templates` | Editor de **mensagens** com variáveis e prévia |

---

## 🎯 Destaques por área

### 👥 Leads
- Contadores dos **6 status** (antes só 4), clicáveis para filtrar.
- **Ordenação**: recentes, antigos, nome, etapa do funil, próximo contato e distância.
- **Paginação** ("Carregar mais") e carregamento acima do limite de 1000 linhas do Supabase.
- **Ações em massa**: selecionar vários, mudar status, exportar e excluir (com confirmação).
- **Exportação CSV** pronta para o Excel (`;` + BOM UTF-8, com proteção contra injeção de fórmula).
- **Deduplicação** no cadastro manual, na importação e na busca (telefone, nome + endereço e `place_id`).
- **Motivo de perda** ao marcar "Sem interesse", exibido no dashboard.

### 📅 Follow-up
- Campos **próximo contato** e **próxima ação** no formulário e na ficha.
- Atalhos de reagendamento: amanhã, 3 dias, 1 semana.
- Chip de **"Retorno atrasado / hoje / data"** nos cards.
- "Último contato" atualizado automaticamente ao registrar contato (inclusive pelo mapa).
- Fechado ou perdido **limpa** a data de retorno.

### 💬 Mensagens
- Templates por **etapa** e por **segmento**, com variáveis `{nome_loja}`, `{seu_nome}`, `{responsavel}` e `{cidade}`.
- Ordem de escolha: template do segmento → template geral da etapa → texto padrão de `lib/message-template.ts`.
- As variáveis antigas `{SEU_NOME}` e `{NOME_DA_LOJA}` continuam funcionando.
- **Convertido** e **Sem interesse** nunca geram mensagem, mesmo que exista template.

### 🔎 Buscar lojas
- **Contador de cota** do plano grátis ("usou X de 500, restam Y"), com barra de progresso.
- **Cache de 24 h**: repetir a mesma busca não gasta cota.
- **Limite de 5 buscas por minuto** por usuário.
- **Bloqueio** de buscas maiores que a cota restante.
- Estados de **carregando** (skeleton), **erro**, **sem resultado** e **vazio inicial**.
- **Prévia com seleção** antes de salvar, com "adicionar selecionadas".
- Segmento dos leads salvos escolhido na própria busca.

### 💰 Financeiro
- Receita **vinculada a um lead**; ao salvar, o lead vira **Convertido** automaticamente.
- **Categorias** de receita e despesa.
- Situação **a receber / recebido** e **a pagar / pago**, com botão "Recebi / Paguei".
- **Despesas recorrentes** e botão "Lançar recorrentes" para o mês.
- **Editar** lançamentos (antes só dava para excluir) e **exportar CSV**.
- **Métricas**: ticket médio, taxa de conversão, custo por lead e receita por segmento.
- **Estado vazio** explicativo no gráfico.

### 📱 Interface e acessibilidade
- Barra de navegação inferior no celular e menu completo em "Mais".
- Sistema único de **avisos (toast)** de sucesso e erro.
- **Skeletons** de carregamento e tela de erro amigável (`app/error.tsx`).
- **Contraste** melhorado em placeholders e textos de apoio no tema escuro.
- Foco visível no teclado.

---

## 🛡️ Segurança e infraestrutura

- A rota `/api/buscar-lojas` agora **confere o login no servidor** (cliente Supabase com cookies, então o RLS continua valendo).
- A chave da busca continua **só no servidor**.
- Cota, cache e limite de frequência ficam no Supabase, **compartilhados** entre os usuários (a chave da API é uma só).
- **Backup JSON** de leads, contatos, financeiro, templates e configurações, em um clique.

> ℹ️ O RLS continua como estava: **todo usuário logado vê todos os dados**, de propósito, porque o painel é de uma equipe pequena. Para separar por usuário seria preciso `user_id` nas tabelas e novas políticas.

---

## 🗄️ Banco de dados (`supabase/melhorias.sql`)

Rodar **uma vez** no SQL Editor do Supabase. É idempotente (pode rodar de novo sem erro).

| Objeto | Mudança |
|---|---|
| `leads` | + `proximo_contato`, `ultimo_contato`, `proxima_acao`, `motivo_perda`, `place_id` (índice único parcial) |
| `financeiro` | + `lead_id` (FK, `on delete set null`), `categoria`, `situacao` (`pago`/`pendente`), `recorrente` |
| `templates` 🆕 | Mensagens editáveis por etapa e segmento |
| `config` 🆕 | Configurações compartilhadas (meta mensal) |
| `buscas` 🆕 | Registro de uso da busca (cota e limite de frequência) |
| `busca_cache` 🆕 | Resultado das buscas por 24 h |

Todas as tabelas novas têm **RLS ativado**.

---

## 🐛 Bugs corrigidos

| Problema | Correção |
|---|---|
| Classes `lh-*` do mapa, histórico e importador **não existiam** no CSS (telas sem estilo) | Adicionadas em `globals.css` |
| Contadores mostravam só 4 dos 6 status | Todos os status, clicáveis |
| Dica da cota solta na tela, sem medir o uso | Contador real + bloqueio |
| Busca sem loading, erro ou "nenhum resultado" | Estados visuais completos |
| Duplicados passavam com espaço duplo no nome | `norm()` agora normaliza espaços (achado pelos testes) |
| Importador apontava "Ver leads" para a home | Aponta para `/leads` |
| Gráfico do financeiro vazio quando zerado | Estado vazio explicativo |

---

## 🧪 Qualidade

- **12 testes automáticos** em `tests/lib.test.ts`, sem dependências novas (usa `node:test`).
  Cobrem conversão, financeiro, follow-up, recorrentes, templates, CSV, duplicados, cache de busca, WhatsApp e distância.
- `npm test` roda os testes e `npm run typecheck` confere os tipos.

```bash
npm test
npm run typecheck
```

**Verificado:** TypeScript em modo estrito sem erros e 12/12 testes passando.
**Não verificado:** `next build` e o uso real contra o Supabase (o ambiente de desenvolvimento não tinha internet). Rode `npm run dev` e passe pelas telas antes de publicar.

---

## 📁 Arquivos

<details>
<summary><b>🆕 Novos</b></summary>

```text
app/hoje/page.tsx                 app/leads/page.tsx
app/leads/[id]/page.tsx           app/pipeline/page.tsx
app/templates/page.tsx            app/error.tsx
components/Dashboard.tsx          components/Hoje.tsx
components/LeadDetalhe.tsx        components/Pipeline.tsx
components/TemplatesMensagem.tsx  components/MotivoPerdaDialog.tsx
components/Toast.tsx
lib/cota.ts                       lib/exportar.ts
lib/leads-acoes.ts                lib/leads-csv.ts
lib/metricas.ts                   lib/templates.ts
lib/useTemplates.ts               lib/supabase/server.ts
supabase/melhorias.sql
tests/lib.test.ts                 tsconfig.test.json
global.d.ts
```
</details>

<details>
<summary><b>✏️ Alterados</b></summary>

```text
app/page.tsx                      (home agora é o Dashboard)
app/financeiro/page.tsx           (Suspense para ler ?lead=)
app/globals.css                   (classes lh-*, contraste, skeleton)
app/api/buscar-lojas/route.ts     (login, cota, cache, limite)
components/BuscarLojas.tsx        components/Financeiro.tsx
components/Painel.tsx             components/LeadCard.tsx
components/LeadForm.tsx           components/FilaEnvio.tsx
components/Shell.tsx              components/HistoricoContato.tsx
components/ImportadorLeads.tsx
lib/types.ts                      lib/importar.ts
package.json  tsconfig.json  .gitignore
README.md  STATUS-DOS-LEADS.md
```
</details>

> 💡 Se o `git status` mostrar mais arquivos modificados do que a lista acima, é diferença de **fim de linha** (CRLF/LF) do Windows, sem mudança de conteúdo.

---

## 🧩 Decisões de projeto

- **Meta mensal** conta leads com receita lançada no mês. O banco não guarda a data em que o lead virou Convertido, então esse é o critério confiável.
- **Conversão** = convertidos ÷ leads já abordados (tudo que saiu de "Novo").
- **Custo por lead** = despesas pagas ÷ total de leads.
- **Pendentes** não entram no lucro; aparecem em "A receber" / "A pagar".
- As colunas novas de `Lead` são **opcionais** no tipo, então o app continua abrindo mesmo antes da migração (as telas novas avisam para rodar o SQL).

---

## ▶️ Como aplicar

```bash
# 1. Banco: rode supabase/melhorias.sql no SQL Editor do Supabase

# 2. Código
npm install
npm test
npm run dev        # confira as telas novas

# 3. Publicar
git add .
git commit -m "feat: pipeline, follow-up, templates, cota da busca e financeiro ligado aos leads"
git push
```

---

## 🔭 Próximos passos sugeridos

- [ ] Lembretes dos retornos do dia por e-mail ou push
- [ ] Geocodificação automática pelo endereço (leads sem coordenadas no mapa)
- [ ] Data de conversão no lead, para uma meta mensal mais precisa
- [ ] Permissões por usuário, se a equipe crescer
- [ ] Testes de interface (Playwright) nas telas principais

---

<div align="center">

Feito para vender mais sites, com menos planilha. ✨

</div>
