# Status dos leads: o que significa cada um

Cada lead tem um **status** (a "tag" colorida no card). Ele diz em que ponto da conversa a loja está e define **qual mensagem aparece** no card.

## Resumo

| Status | O que significa | Quando marcar | Mensagem no card? |
|---|---|---|---|
| **Novo** | Lead cadastrado, ninguém falou com ele ainda | Ao cadastrar ou importar a loja | Sim: primeiro contato |
| **Entrar em contato** | Lead separado para ser chamado: está na fila, mas a primeira mensagem ainda não foi enviada | Quando você escolher a loja para abordar (ex.: a lista do dia) | Sim: primeiro contato (o mesmo texto do Novo) |
| **Contato realizado** | Você já mandou a primeira mensagem, mas ainda não houve resposta | Logo depois de enviar a mensagem de "Novo" | Sim: acompanhamento (cobrar uma resposta) |
| **Interessado** | A pessoa respondeu e demonstrou interesse | Quando ela pedir mais informações ou disser que quer ver | Sim: apresentar valores e marcar conversa |
| **Negociação** | Proposta e valores enviados, em fase de decisão | Depois de mandar o orçamento | Sim: perguntar se avaliou a proposta |
| **Convertido** | Fechou negócio, virou cliente | Quando o pagamento ou o acordo for confirmado | **Não**: só a tag |
| **Sem interesse** | Recusou, ou não é o perfil | Quando disser "não" ou pedir para parar de receber mensagem | **Não**: só a tag |

## Por que dois status ficam sem mensagem

- **Sem interesse:** insistir depois de uma recusa incomoda o cliente e pode levar a bloqueio e denúncia no WhatsApp. O lead fica guardado para consulta, sem texto pronto que convide a chamar de novo.
- **Convertido:** o cliente já fechou. Não existe mensagem de venda para mandar. O atendimento dele vai por conversa normal, fora do fluxo de prospecção.

Nos dois casos o card mostra só a tag e um aviso curto, sem caixa de mensagem e sem os botões **WhatsApp** e **Copiar mensagem**. **Ver detalhes**, **Editar** e **Excluir** continuam funcionando.

## Caminho normal de um lead

```
Novo  →  Entrar em contato  →  Contato realizado  →  Interessado  →  Negociação  →  Convertido
  \              \                    \                    \               \
   \______________\____________________\____________________\_______________\____→  Sem interesse
```

Um lead pode virar **Sem interesse** em qualquer etapa. Pode também voltar para uma etapa anterior se a pessoa mudar de ideia.

## Rotina sugerida

1. Cadastre ou busque lojas: entram como **Novo**.
2. Separe as que vai chamar agora movendo para **Entrar em contato** (etapa opcional, serve de fila).
3. Envie a mensagem do card e mude para **Contato realizado**.
4. Se a pessoa não responder em 2 a 3 dias, abra o card de novo e use a mensagem de acompanhamento (o texto do status já é esse).
5. Se ela demonstrar interesse, mude para **Interessado** e use o texto de apresentação.
6. Depois de enviar a proposta, mude para **Negociação**.
7. Fechou? **Convertido**. Recusou? **Sem interesse**.

A cada mudança de status o texto do card troca sozinho. Atenção: se você tinha editado a mensagem à mão, ao mudar o status ela volta ao texto padrão do novo status.

## Como alterar os textos

Abra `lib/message-template.ts` e edite o objeto `MESSAGES`. Os marcadores são:

- `{SEU_NOME}`: vira o nome de quem está logado (veja `lib/usuarios.ts`)
- `{NOME_DA_LOJA}`: vira o nome da loja do card

Para **dar mensagem** a um status que hoje não tem (por exemplo, "Convertido"), adicione uma linha nova em `MESSAGES` com o nome do status (`convertido: '...'`). Para **tirar** a mensagem de um status, apague a linha dele.

Os nomes internos dos status são: `novo`, `entrar_em_contato`, `contato_realizado`, `interessado`, `negociacao`, `sem_interesse` e `convertido`.

## Banco de dados

A etapa **Entrar em contato** é um valor novo do campo `status`. Rode **uma vez** o arquivo `supabase/etapa-entrar-em-contato.sql` no SQL Editor do Supabase (sozinho, sem outros comandos junto). Sem isso, mover um lead para a nova etapa dá erro.

No cálculo de conversão, "Entrar em contato" conta como lead ainda não abordado, igual ao Novo.

## Novidades relacionadas ao funil

- **Motivo da perda:** ao mover um lead para **Sem interesse** (no card, na ficha, no Kanban ou em massa), o sistema pergunta o motivo. Os mais comuns aparecem no Início.
- **Follow-up:** leads em andamento podem ter **próximo contato** e **próxima ação**. Quando viram **Convertido** ou **Sem interesse**, a data de retorno é limpa.
- **Convertido automático:** lançar uma **receita vinculada a um lead** no Financeiro marca o lead como Convertido.
- **Mensagens por segmento:** em **Mensagens** você cria textos por etapa e por segmento. Convertido e Sem interesse continuam sem mensagem, mesmo que exista template.
