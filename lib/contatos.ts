export const TIPOS_CONTATO = {
  whatsapp: 'WhatsApp', ligacao: 'Ligação', email: 'E-mail',
  visita: 'Visita', reuniao: 'Reunião', outro: 'Outro',
} as const
export type TipoContato = keyof typeof TIPOS_CONTATO
export type Contato = {
  id: string; lead_id: string; user_id: string; user_nome: string; user_email: string | null
  tipo: TipoContato; nota: string | null; contatado_em: string; created_at: string
}
