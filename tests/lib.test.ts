import test from 'node:test'
import assert from 'node:assert/strict'
import { ativo, custoPorLead, receitaPorSegmento, repetirNoMes, situacaoFollowUp, somaTipo, taxaConversao, ticketMedio, type Lancamento } from '../lib/metricas'
import { aplicarVariaveis, mensagemDoLead, type Template } from '../lib/templates'
import { paraCsv } from '../lib/exportar'
import { chavesDoLead, construirLeads, detectarMapeamento } from '../lib/importar'
import { chaveBusca } from '../lib/cota'
import { temMensagem, whatsappNumber } from '../lib/message-template'
import { FUNIL, normalizarStatus } from '../lib/types'
import { distanceKm } from '../lib/geo'
import { lerPrecos, totalDaVenda } from '../lib/precos'

const L = (o: Partial<Lancamento>): Lancamento => ({ id: Math.random().toString(), tipo: 'receita', descricao: 'x', valor: 100, data: '2026-10-10', ...o })

test('conversão = fechados ÷ abordados (novos não contam)', () => {
  const ls = [{ status: 'novo' }, { status: 'novo' }, { status: 'contato_realizado' }, { status: 'convertido' }, { status: 'sem_interesse' }] as const
  assert.equal(taxaConversao([...ls]), 1 / 3)
  assert.equal(taxaConversao([]), 0)
})

test('a etapa antiga Entrar em contato é tratada como Novo', () => {
  assert.equal(normalizarStatus('entrar_em_contato'), 'novo')
  assert.equal(normalizarStatus('novo'), 'novo')
  assert.equal(FUNIL.includes('entrar_em_contato' as never), false)
  const ls = [{ status: normalizarStatus('novo') }, { status: normalizarStatus('entrar_em_contato') }, { status: normalizarStatus('contato_realizado') }, { status: normalizarStatus('convertido') }]
  assert.equal(taxaConversao(ls), 1 / 2)
})

test('financeiro: pendente não entra no lucro, só em "a receber"', () => {
  const l = [L({ valor: 1000 }), L({ valor: 500, situacao: 'pendente' }), L({ tipo: 'despesa', valor: 200 })]
  assert.equal(somaTipo(l, 'receita'), 1000)
  assert.equal(somaTipo(l, 'receita', 'pendente'), 500)
  assert.equal(ticketMedio(l), 1000)
  assert.equal(custoPorLead(l, 10), 20)
  assert.equal(custoPorLead(l, 0), 0)
})

test('receita por segmento usa o segmento do lead vinculado', () => {
  const r = receitaPorSegmento([L({ lead_id: 'a', valor: 300 }), L({ lead_id: 'b', valor: 100 }), L({ valor: 50 })],
    [{ id: 'a', segmento: 'loja' }, { id: 'b', segmento: 'beleza' }])
  assert.deepEqual(r, [['loja', 300], ['beleza', 100], ['sem_segmento', 50]])
})

test('follow-up: atrasado, hoje, futuro e sem data', () => {
  assert.equal(situacaoFollowUp('2026-10-01', '2026-10-19'), 'atrasado')
  assert.equal(situacaoFollowUp('2026-10-19', '2026-10-19'), 'hoje')
  assert.equal(situacaoFollowUp('2026-10-25', '2026-10-19'), 'futuro')
  assert.equal(situacaoFollowUp(null, '2026-10-19'), null)
  assert.equal(ativo('convertido'), false)
  assert.equal(ativo('interessado'), true)
})

test('despesas recorrentes são copiadas só uma vez para o mês seguinte', () => {
  const base = [L({ tipo: 'despesa', descricao: 'Hospedagem', recorrente: true, data: '2026-09-05', valor: 30 })]
  const novos = repetirNoMes(base, '2026-10')
  assert.equal(novos.length, 1)
  assert.equal(novos[0].data, '2026-10-05'); assert.equal(novos[0].situacao, 'pendente')
  assert.equal(repetirNoMes([...base, L({ tipo: 'despesa', descricao: 'hospedagem', recorrente: true, data: '2026-10-05' })], '2026-10').length, 0)
  assert.equal(repetirNoMes([L({ tipo: 'despesa', descricao: 'Dom', recorrente: true, data: '2026-12-02' })], '2027-01')[0].data, '2027-01-02')
})

test('templates: variáveis novas e antigas', () => {
  const v = { nomeLoja: 'Padaria', seuNome: 'Henrique', responsavel: 'Ana', cidade: 'BH' }
  assert.equal(aplicarVariaveis('Oi {responsavel}, {SEU_NOME} da {NOME_DA_LOJA} / {nome_loja} / {seu_nome} / {cidade}', v), 'Oi Ana, Henrique da Padaria / Padaria / Henrique / BH')
  assert.equal(aplicarVariaveis('{nome_loja} $& $1', v), 'Padaria $& $1') // sem interpretação de $ no valor
})

test('mensagem de primeiro contato é fixa e ignora templates antigos', () => {
  const t: Template[] = [{ id: '1', nome: 'personalizado', segmento: 'beleza', status: 'novo', texto: 'Texto personalizado para {nome_loja}' }]
  const lead = { nome_loja: 'Salão', status: 'novo' as const, segmento: 'beleza', responsavel: null, cidade: null }
  assert.match(mensagemDoLead(lead, 'Henrique', t), /Olá, tudo bem\? Aqui é o Henrique/)
  assert.match(mensagemDoLead(lead, 'Henrique', t), /Vi a Salão/)
  assert.doesNotMatch(mensagemDoLead(lead, 'Henrique', t), /Texto personalizado/)
  assert.equal(mensagemDoLead({ ...lead, status: normalizarStatus('entrar_em_contato') }, 'Henrique', []), mensagemDoLead(lead, 'Henrique', []))
})

test('as demais etapas são etiquetas e não geram mensagens automáticas', () => {
  const t: Template[] = [{ id: '1', nome: 'x', segmento: null, status: 'convertido' as never, texto: 'oi' }]
  assert.equal(temMensagem('novo'), true)
  for (const status of ['contato_realizado', 'interessado', 'negociacao', 'sem_interesse', 'convertido'] as const) {
    assert.equal(temMensagem(status), false)
    assert.equal(mensagemDoLead({ nome_loja: 'A', status, segmento: null, responsavel: null, cidade: null }, 'H', t), '')
  }
})

test('CSV: escapa aspas/ponto-e-vírgula e bloqueia fórmulas', () => {
  const csv = paraCsv([{ a: 'x;y', b: 'diz "oi"', c: '=SOMA(A1)', d: ['p', 'q'] }], [{ chave: 'a', rotulo: 'A' }, { chave: 'b', rotulo: 'B' }, { chave: 'c', rotulo: 'C' }, { chave: 'd', rotulo: 'D' }])
  assert.equal(csv, 'A;B;C;D\r\n"x;y";"diz ""oi""";\'=SOMA(A1);p, q')
})

test('duplicados: telefone com ou sem 55 e nome+endereço', () => {
  assert.ok(chavesDoLead('A', 'Rua 1', '(31) 99999-0000').some(k => chavesDoLead('Outra', null, '+55 31 99999-0000').includes(k)))
  assert.ok(chavesDoLead('Padaria  Café', 'Rua 1', null).some(k => chavesDoLead('padaria cafe', 'rua 1', null).includes(k)))
  const mapa = detectarMapeamento(['Nome da loja', 'Telefone'])
  const existentes = new Set(chavesDoLead('Já existe', null, '31988887777'))
  const r = construirLeads([['Nova', '31911112222'], ['Outra', '(31) 98888-7777'], ['Nova', '31911112222'], ['', '1']], mapa, existentes)
  assert.equal(r.validos.length, 1); assert.equal(r.duplicados, 2); assert.equal(r.semNome, 1)
})

test('cache de busca: mesma consulta com acento/caixa/espaços gera a mesma chave', () => {
  assert.equal(chaveBusca(' Barbearia ', 'Savassi,  Belo Horizonte', 20), chaveBusca('barbearía', 'savassi, belo horizonte', 20))
  assert.notEqual(chaveBusca('a', 'b', 20), chaveBusca('a', 'b', 40))
})

test('WhatsApp e distância', () => {
  assert.equal(whatsappNumber('(31) 99999-0000'), '5531999990000')
  assert.equal(whatsappNumber('5531999990000'), '5531999990000')
  assert.equal(whatsappNumber('123'), null)
  assert.ok(Math.abs(distanceKm(-19.9167, -43.9345, -19.9167, -43.9345)) < 1e-9)
  assert.ok(distanceKm(-19.9167, -43.9345, -23.5505, -46.6333) > 400 && distanceKm(-19.9167, -43.9345, -23.5505, -46.6333) < 600)
})

test('venda automática: soma o preço das soluções do lead e ignora as sem preço', () => {
  const p = lerPrecos({ landing_page: 800, site_institucional: '1500', agendamento_online: 0, comandas: 'abc' })
  assert.deepEqual(p, { landing_page: 800, site_institucional: 1500 })
  assert.equal(totalDaVenda({ solucoes: ['landing_page', 'site_institucional', 'comandas'] }, p), 2300)
  assert.equal(totalDaVenda({ solucoes: ['comandas'] }, p), 0)   // sem preço configurado: o painel pergunta o valor
  assert.equal(totalDaVenda({ solucoes: null }, p), 0)
})
