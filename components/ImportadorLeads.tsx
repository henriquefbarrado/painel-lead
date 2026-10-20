'use client'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, Users } from 'lucide-react'
import PageHeader from './PageHeader'
import { supabase } from '@/lib/supabase/client'
import { STATUS } from '@/lib/types'
import {
  CAMPOS, MODELO_CSV, chavesDoLead, construirLeads, detectarMapeamento, lerArquivo,
  type Aba, type CampoChave, type Mapeamento,
} from '@/lib/importar'

// Busca todos os leads já salvos (em páginas de 1000) para não importar duplicados.
async function chavesExistentes() {
  const s = new Set<string>()
  for (let de = 0; ; de += 1000) {
    const { data, error } = await supabase().from('leads').select('nome_loja,endereco,whatsapp').order('id').range(de, de + 999)
    if (error) throw new Error(error.message)
    ;(data || []).forEach(l => chavesDoLead(l.nome_loja, l.endereco, l.whatsapp).forEach(k => s.add(k)))
    if (!data || data.length < 1000) break
  }
  return s
}

export default function ImportadorLeads() {
  const [abas, setAbas] = useState<Aba[]>([]), [abaIdx, setAbaIdx] = useState(0), [arquivo, setArquivo] = useState('')
  const [mapa, setMapa] = useState<Mapeamento>({}), [existentes, setExistentes] = useState<Set<string>>(new Set())
  const [arrastando, setArrastando] = useState(false), [lendo, setLendo] = useState(false)
  const [enviando, setEnviando] = useState(false), [progresso, setProgresso] = useState(0)
  const [erro, setErro] = useState(''), [importados, setImportados] = useState<number | null>(null)

  const aba = abas[abaIdx], cabecalhos = aba?.linhas[0] ?? [], dados = useMemo(() => aba?.linhas.slice(1) ?? [], [aba])
  const analise = useMemo(() => construirLeads(dados, mapa, existentes), [dados, mapa, existentes])

  function reiniciar() { setAbas([]); setAbaIdx(0); setArquivo(''); setMapa({}); setErro(''); setImportados(null); setProgresso(0) }

  async function escolher(file: File) {
    reiniciar(); setLendo(true)
    try {
      const lidas = await lerArquivo(file)
      if (!lidas.length || lidas[0].linhas.length < 2) throw new Error('A planilha está vazia ou tem só o cabeçalho.')
      setExistentes(await chavesExistentes())
      setAbas(lidas); setAbaIdx(0); setMapa(detectarMapeamento(lidas[0].linhas[0])); setArquivo(file.name)
    } catch (e) { setErro('Não foi possível ler o arquivo: ' + (e instanceof Error ? e.message : 'erro desconhecido')) }
    setLendo(false)
  }
  function trocarAba(i: number) { setAbaIdx(i); setMapa(detectarMapeamento(abas[i].linhas[0])) }
  function definir(chave: CampoChave, valor: string) {
    setMapa(m => { const n = { ...m }; if (valor === '') delete n[chave]; else n[chave] = Number(valor); return n })
  }
  function baixarModelo() {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + MODELO_CSV], { type: 'text/csv;charset=utf-8' }))
    a.download = 'modelo-leads.csv'; a.click(); URL.revokeObjectURL(a.href)
  }
  async function importar() {
    setEnviando(true); setErro(''); setProgresso(0)
    const { validos } = analise, lote = 200
    for (let i = 0; i < validos.length; i += lote) {
      const { error } = await supabase().from('leads').insert(validos.slice(i, i + lote))
      if (error) { setErro(`Erro ao importar (${i} leads já foram salvos): ${error.message}`); setEnviando(false); return }
      setProgresso(Math.min(i + lote, validos.length))
    }
    setImportados(validos.length); setEnviando(false)
  }

  const semMapaNome = mapa.nome_loja === undefined
  return (
    <div className="space-y-6">
      <PageHeader titulo="Importar leads" sub="Suba uma planilha CSV ou Excel e confira as colunas antes de salvar." icone={<FileSpreadsheet size={24} />}>
        <button className="btn-w" onClick={baixarModelo}><Download size={16} />Baixar modelo</button>
      </PageHeader>

      {importados !== null ? (
        <div className="card space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={44} />
          <div><h2 className="text-xl font-bold">{importados} leads importados</h2>
            <p className="text-sm text-slate-500">Eles já estão na lista de leads.</p></div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/leads" className="btn-p"><Users size={16} />Ver leads</Link>
            <button className="btn" onClick={reiniciar}>Importar outra planilha</button>
          </div>
        </div>
      ) : (
        <>
          <label className={`lh-drop ${arrastando ? 'lh-drop-ativa' : ''}`}
            onDragOver={e => { e.preventDefault(); setArrastando(true) }} onDragLeave={() => setArrastando(false)}
            onDrop={e => { e.preventDefault(); setArrastando(false); const f = e.dataTransfer.files[0]; if (f) escolher(f) }}>
            <Upload size={28} />
            <span className="font-semibold text-slate-700">{lendo ? 'Lendo planilha…' : arquivo ? `${arquivo} (clique para trocar)` : 'Arraste a planilha aqui ou clique para escolher'}</span>
            <span className="text-sm">Aceita .csv, .xlsx e .xls. A primeira linha deve ser o cabeçalho.</span>
            <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={e => { const f = e.target.files?.[0]; if (f) escolher(f); e.target.value = '' }} />
          </label>
          {erro && <p className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</p>}

          {aba && (
            <>
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold">Confira as colunas</h2>
                  {abas.length > 1 && (
                    <select className="inp !w-auto" value={abaIdx} onChange={e => trocarAba(Number(e.target.value))} aria-label="Aba da planilha">
                      {abas.map((a, i) => <option key={a.nome} value={i}>Aba: {a.nome}</option>)}</select>)}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {CAMPOS.map(c => (
                    <label key={c.chave} className="block text-sm">{c.rotulo}
                      <select className="inp mt-1" value={mapa[c.chave] ?? ''} onChange={e => definir(c.chave, e.target.value)}>
                        <option value="">— não importar —</option>
                        {cabecalhos.map((h, i) => <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>)}</select>
                    </label>))}
                </div>
              </div>

              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="lh-chip bg-emerald-100 text-emerald-700">{analise.validos.length} para importar</span>
                  {analise.duplicados > 0 && <span className="lh-chip bg-amber-100 text-amber-700">{analise.duplicados} duplicados (ignorados)</span>}
                  {analise.semNome > 0 && <span className="lh-chip bg-slate-200 text-slate-600">{analise.semNome} sem nome (ignorados)</span>}
                  {analise.coordInvalidas > 0 && <span className="lh-chip bg-rose-100 text-rose-700">{analise.coordInvalidas} coordenadas inválidas</span>}
                </div>
                {semMapaNome && <p className="flex items-center gap-2 text-sm text-amber-600"><AlertTriangle size={16} />Escolha a coluna do nome da loja para continuar.</p>}
                {analise.validos.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-500"><tr>{['Loja', 'WhatsApp', 'Cidade/UF', 'Coordenadas', 'Status'].map(h => <th key={h} className="px-2 py-1.5 font-medium">{h}</th>)}</tr></thead>
                      <tbody>{analise.validos.slice(0, 5).map((l, i) => (
                        <tr key={i} className="border-t border-slate-200">
                          <td className="px-2 py-1.5 font-medium">{l.nome_loja}</td><td className="px-2 py-1.5">{l.whatsapp || '—'}</td>
                          <td className="px-2 py-1.5">{[l.cidade, l.estado].filter(Boolean).join('/') || '—'}</td>
                          <td className="px-2 py-1.5">{l.latitude != null ? `${l.latitude}, ${l.longitude}` : '—'}</td>
                          <td className="px-2 py-1.5">{STATUS[l.status]}</td></tr>))}</tbody>
                    </table>
                    {analise.validos.length > 5 && <p className="pt-2 text-xs text-slate-500">Mostrando 5 de {analise.validos.length}.</p>}
                  </div>)}
                <div className="flex flex-wrap items-center gap-3">
                  <button className="btn-p" disabled={enviando || analise.validos.length === 0} onClick={importar}>
                    {enviando ? `Importando… ${progresso}/${analise.validos.length}` : `Importar ${analise.validos.length} leads`}</button>
                  <p className="text-xs text-slate-500">Leads sem latitude e longitude entram normalmente na lista.</p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
