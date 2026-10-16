export const STATUS = {
  novo: 'Novo', contato_realizado: 'Contato realizado', interessado: 'Interessado',
  sem_interesse: 'Sem interesse', negociacao: 'Negociação', convertido: 'Convertido',
} as const
export type Status = keyof typeof STATUS
export type Lead = {
  id: string; nome_loja: string; responsavel: string | null; whatsapp: string | null
  endereco: string | null; cidade: string | null; estado: string | null; cep: string | null
  latitude: number | null; longitude: number | null; categoria: string | null
  segmento: string | null; solucoes: string[]; status: Status; observacoes: string | null; created_at: string
}
export type LeadInput = Omit<Lead, 'id' | 'created_at'>
export const STATUS_COR: Record<Status, string> = {
  novo: 'bg-sky-100 text-sky-700', contato_realizado: 'bg-violet-100 text-violet-700',
  interessado: 'bg-amber-100 text-amber-700', sem_interesse: 'bg-slate-200 text-slate-600',
  negociacao: 'bg-orange-100 text-orange-700', convertido: 'bg-emerald-100 text-emerald-700',
}
