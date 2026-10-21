# Status dos leads: o que significa cada um

Cada lead tem um **status** (a etiqueta colorida do card). O status mostra em que ponto da prospecção a loja está. A mensagem padrão de primeiro contato fica disponível apenas em **Novo**; as demais etapas funcionam como etiquetas do funil.

## Resumo

| Status | O que significa | Quando marcar | Mensagem padrão? |
|---|---|---|---|
| **Novo** | Lead cadastrado, primeira mensagem ainda não enviada | Ao cadastrar ou importar a loja; permanece aqui até você abordar | **Sim: primeiro contato** |
| **Contato realizado** | A primeira mensagem já foi enviada, ainda sem resposta | Logo após enviar a mensagem do card em Novo | Não; use a conversa já iniciada para acompanhar |
| **Interessado** | A loja respondeu e demonstrou interesse | Quando pedir mais informações ou quiser ver uma proposta | Não; registre as próximas ações no follow-up |
| **Negociação** | Proposta e valores enviados, em fase de decisão | Depois de enviar o orçamento | Não; acompanhe a negociação |
| **Convertido** | Fechou negócio, virou cliente | Quando pagamento ou acordo for confirmado | Não; só a etiqueta |
| **Sem interesse** | Recusou ou não é o perfil | Quando disser que não tem interesse ou pedir para não receber contato | Não; só a etiqueta |

## Caminho normal de um lead

```
Novo → Contato realizado → Interessado → Negociação → Convertido
  └──────────── qualquer etapa ────────────→ Sem interesse
```

Um lead pode virar **Sem interesse** em qualquer etapa. Também pode voltar para uma etapa anterior se a conversa mudar.

## Rotina sugerida

1. Cadastre ou busque lojas: elas entram como **Novo**.
2. Abra o WhatsApp pelo botão **Chamar** no card Novo e envie a mensagem padrão.
3. Depois de enviar, arraste o lead diretamente para **Contato realizado**.
4. Se a loja responder e demonstrar interesse, mova para **Interessado**.
5. Depois de enviar a proposta, mova para **Negociação**.
6. Fechou? **Convertido**. Recusou? **Sem interesse**.

O painel não tem mais a etapa intermediária **Entrar em contato**. Registros antigos que ainda estiverem nela são tratados como **Novo** e podem ser normalizados no banco com a migração descrita abaixo.

## Mensagem padrão

O texto do primeiro contato fica em `lib/message-template.ts`. Os marcadores aceitos são:

- `{SEU_NOME}`: vira o nome de quem está logado.
- `{NOME_DA_LOJA}`: vira o nome da loja do card.

Templates antigos podem permanecer guardados no banco, mas não substituem a mensagem padrão do primeiro contato.

## Banco de dados

Se você já tinha leads na etapa **Entrar em contato**, rode uma vez `supabase/remover-etapa-entrar-em-contato.sql` no SQL Editor do Supabase. Isso altera esses registros para **Novo**. O painel também reconhece o status legado na leitura, então os leads não desaparecem mesmo antes de executar essa migração.

Em instalações novas, `supabase/schema.sql` já não cria a opção antiga.

## Recursos relacionados

- **Motivo da perda:** ao mover um lead para **Sem interesse**, o painel pergunta o motivo.
- **Follow-up:** leads em andamento podem ter **próximo contato** e **próxima ação**.
- **Convertido automático:** lançar uma receita vinculada a um lead no Financeiro marca o lead como Convertido.
