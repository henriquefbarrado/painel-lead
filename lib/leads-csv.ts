import { paraCsv } from './exportar'
import { SEGMENTOS } from './segmentos'
import { STATUS, type Lead } from './types'

export function leadsParaCsv(leads: Lead[]) {
  const linhas = leads.map(l => ({
    ...l, status: STATUS[l.status], segmento: l.segmento ? (SEGMENTOS[l.segmento]?.nome ?? l.segmento) : '',
    created_at: l.created_at?.slice(0, 10),
  }))
  return paraCsv(linhas as unknown as Record<string, unknown>[], [
    { chave: 'nome_loja', rotulo: 'nome_loja' }, { chave: 'responsavel', rotulo: 'responsavel' }, { chave: 'whatsapp', rotulo: 'whatsapp' },
    { chave: 'endereco', rotulo: 'endereco' }, { chave: 'cidade', rotulo: 'cidade' }, { chave: 'estado', rotulo: 'estado' }, { chave: 'cep', rotulo: 'cep' },
    { chave: 'latitude', rotulo: 'latitude' }, { chave: 'longitude', rotulo: 'longitude' }, { chave: 'categoria', rotulo: 'categoria' },
    { chave: 'segmento', rotulo: 'segmento' }, { chave: 'status', rotulo: 'status' }, { chave: 'proximo_contato', rotulo: 'proximo_contato' },
    { chave: 'motivo_perda', rotulo: 'motivo_perda' }, { chave: 'observacoes', rotulo: 'observacoes' }, { chave: 'created_at', rotulo: 'cadastro' },
  ])
}
