// Exportação em CSV (abre direto no Excel em português: separador ";" e BOM UTF-8).
// Células que começam com = + - @ ganham um apóstrofo para não virarem fórmula na planilha.
const celula = (v: unknown) => {
  let s = v == null ? '' : Array.isArray(v) ? v.join(', ') : String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

export function paraCsv<T extends Record<string, unknown>>(linhas: T[], colunas: { chave: keyof T & string; rotulo: string }[]) {
  const cab = colunas.map(c => celula(c.rotulo)).join(';')
  return [cab, ...linhas.map(l => colunas.map(c => celula(l[c.chave])).join(';'))].join('\r\n')
}

export function baixar(nome: string, conteudo: string, mime = 'text/csv;charset=utf-8') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + conteudo], { type: mime }))
  a.download = nome; a.click(); URL.revokeObjectURL(a.href)
}
