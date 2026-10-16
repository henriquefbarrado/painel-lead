import { STATUS, type LeadInput, type Status } from './types'

export const norm = (s: unknown) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export type CampoChave = 'nome_loja' | 'responsavel' | 'whatsapp' | 'endereco' | 'cidade' | 'estado' |
  'cep' | 'latitude' | 'longitude' | 'categoria' | 'status' | 'observacoes'

// "apelidos" são os nomes de coluna reconhecidos automaticamente (sem acento e em minúsculas).
export const CAMPOS: { chave: CampoChave; rotulo: string; apelidos: string[] }[] = [
  { chave: 'nome_loja', rotulo: 'Nome da loja *', apelidos: ['nome_loja', 'nome da loja', 'loja', 'nome', 'empresa', 'razao social', 'estabelecimento', 'cliente'] },
  { chave: 'responsavel', rotulo: 'Responsável', apelidos: ['responsavel', 'contato', 'proprietario', 'dono'] },
  { chave: 'whatsapp', rotulo: 'WhatsApp / telefone', apelidos: ['whatsapp', 'telefone', 'celular', 'fone', 'tel', 'phone'] },
  { chave: 'endereco', rotulo: 'Endereço', apelidos: ['endereco', 'logradouro', 'rua', 'address'] },
  { chave: 'cidade', rotulo: 'Cidade', apelidos: ['cidade', 'municipio', 'city'] },
  { chave: 'estado', rotulo: 'Estado (UF)', apelidos: ['estado', 'uf', 'state'] },
  { chave: 'cep', rotulo: 'CEP', apelidos: ['cep', 'codigo postal'] },
  { chave: 'latitude', rotulo: 'Latitude', apelidos: ['latitude', 'lat'] },
  { chave: 'longitude', rotulo: 'Longitude', apelidos: ['longitude', 'lng', 'lon', 'long'] },
  { chave: 'categoria', rotulo: 'Categoria / segmento', apelidos: ['categoria', 'segmento', 'ramo', 'tipo', 'nicho'] },
  { chave: 'status', rotulo: 'Status', apelidos: ['status', 'situacao', 'etapa'] },
  { chave: 'observacoes', rotulo: 'Observações', apelidos: ['observacoes', 'observacao', 'obs', 'notas', 'anotacoes'] },
]

// índice da coluna da planilha para cada campo; campo ausente = não importar
export type Mapeamento = Partial<Record<CampoChave, number>>

export function detectarMapeamento(cabecalhos: string[]): Mapeamento {
  const n = cabecalhos.map(norm), usados = new Set<number>(), m: Mapeamento = {}
  for (const c of CAMPOS) { // 1ª passada: nome de coluna idêntico
    const i = n.findIndex((h, k) => !usados.has(k) && c.apelidos.includes(h))
    if (i >= 0) { m[c.chave] = i; usados.add(i) }
  }
  for (const c of CAMPOS) { // 2ª passada: coluna que contém o apelido
    if (m[c.chave] !== undefined) continue
    const i = n.findIndex((h, k) => !usados.has(k) && h !== '' && c.apelidos.some(a => a.length >= 4 && h.includes(a)))
    if (i >= 0) { m[c.chave] = i; usados.add(i) }
  }
  return m
}

// ---------- leitura de arquivo ----------
export type Aba = { nome: string; linhas: string[][] }

function detectarSeparador(txt: string) {
  const l = txt.split(/\r?\n/, 1)[0] || ''
  const c = (ch: string) => l.split(ch).length - 1
  const opcoes: [string, number][] = [[';', c(';')], [',', c(',')], ['\t', c('\t')]]
  opcoes.sort((a, b) => b[1] - a[1])
  return opcoes[0][1] > 0 ? opcoes[0][0] : ','
}

export function lerCsv(txt: string): string[][] {
  const sep = detectarSeparador(txt), linhas: string[][] = []
  let linha: string[] = [], cel = '', aspas = false
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i]
    if (aspas) {
      if (ch === '"') { if (txt[i + 1] === '"') { cel += '"'; i++ } else aspas = false } else cel += ch
    } else if (ch === '"') aspas = true
    else if (ch === sep) { linha.push(cel.trim()); cel = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && txt[i + 1] === '\n') i++
      linha.push(cel.trim()); cel = ''; linhas.push(linha); linha = []
    } else cel += ch
  }
  if (cel !== '' || linha.length) { linha.push(cel.trim()); linhas.push(linha) }
  return linhas.filter(l => l.some(c => c !== ''))
}

export async function lerArquivo(file: File): Promise<Aba[]> {
  const buf = await file.arrayBuffer()
  if (/\.csv$/i.test(file.name)) {
    let txt: string
    try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf) } // CSV do Excel em português costuma vir em Windows-1252
    catch { txt = new TextDecoder('windows-1252').decode(buf) }
    return [{ nome: 'CSV', linhas: lerCsv(txt.replace(/^\uFEFF/, '')) }]
  }
  const XLSX = await import('xlsx')
  const wb = XLSX.read(buf, { type: 'array' })
  return wb.SheetNames.map(nome => {
    const bruto = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nome], { header: 1, raw: false, defval: '', blankrows: false })
    return { nome, linhas: bruto.map(r => r.map(c => String(c ?? '').trim())) }
  }).filter(a => a.linhas.length > 0)
}

// ---------- conversão e duplicados ----------
const digitos = (s: string | null) => {
  const d = (s || '').replace(/\D/g, '')
  return d.length > 11 && d.startsWith('55') ? d.slice(2) : d
}
// Um lead é duplicado se o telefone OU o par nome+endereço já existirem.
export function chavesDoLead(nome: string, endereco: string | null, whatsapp: string | null) {
  const k = ['loja:' + norm(nome) + '|' + norm(endereco)], d = digitos(whatsapp)
  if (d.length >= 10) k.push('tel:' + d)
  return k
}

const STATUS_POR_NOME: Record<string, Status> = {}
for (const [k, v] of Object.entries(STATUS)) { STATUS_POR_NOME[norm(k.replace(/_/g, ' '))] = k as Status; STATUS_POR_NOME[norm(v)] = k as Status }

export type Analise = { validos: LeadInput[]; duplicados: number; semNome: number; coordInvalidas: number }

export function construirLeads(linhas: string[][], mapa: Mapeamento, existentes: Set<string>): Analise {
  const vistos = new Set(existentes), validos: LeadInput[] = []
  let duplicados = 0, semNome = 0, coordInvalidas = 0
  const txt = (r: string[], k: CampoChave) => { const i = mapa[k]; return i === undefined ? '' : (r[i] ?? '').trim() }
  const ou = (s: string) => (s === '' ? null : s)
  const coord = (s: string, max: number) => {
    if (s === '') return null
    const n = parseFloat(s.replace(',', '.'))
    if (!isFinite(n) || Math.abs(n) > max) { coordInvalidas++; return null }
    return n
  }
  for (const r of linhas) {
    const nome = txt(r, 'nome_loja')
    if (!nome) { semNome++; continue }
    const uf = txt(r, 'estado')
    const lead: LeadInput = {
      nome_loja: nome, responsavel: ou(txt(r, 'responsavel')), whatsapp: ou(txt(r, 'whatsapp')),
      endereco: ou(txt(r, 'endereco')), cidade: ou(txt(r, 'cidade')), estado: ou(uf.length === 2 ? uf.toUpperCase() : uf),
      cep: ou(txt(r, 'cep')), latitude: coord(txt(r, 'latitude'), 90), longitude: coord(txt(r, 'longitude'), 180),
      categoria: ou(txt(r, 'categoria')), status: STATUS_POR_NOME[norm(txt(r, 'status'))] ?? 'novo',
      observacoes: ou(txt(r, 'observacoes')),
    }
    if (lead.latitude == null || lead.longitude == null) { lead.latitude = null; lead.longitude = null }
    const chaves = chavesDoLead(lead.nome_loja, lead.endereco, lead.whatsapp)
    if (chaves.some(c => vistos.has(c))) { duplicados++; continue }
    chaves.forEach(c => vistos.add(c)); validos.push(lead)
  }
  return { validos, duplicados, semNome, coordInvalidas }
}

export const MODELO_CSV =
  'nome_loja;responsavel;whatsapp;endereco;cidade;estado;cep;latitude;longitude;categoria;status;observacoes\n' +
  'Padaria Central;Ana Souza;(31) 99999-0000;Av. Afonso Pena 1000;Belo Horizonte;MG;30130-003;-19.9208;-43.9378;Padaria;novo;Indicação\n'
