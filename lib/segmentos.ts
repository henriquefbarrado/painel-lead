// Catálogo de segmentos e soluções. Para incluir ou renomear, edite só aqui.
// Os leads guardam os identificadores (ex.: 'cardapio_digital'), então não troque um id já usado.
export const SOLUCOES: Record<string, string> = {
  cardapio_digital: 'Cardápio digital',
  pedidos_online: 'Pedidos online',
  comandas: 'Sistema de comandas',
  landing_page: 'Landing page',
  pagina_vendas: 'Página de vendas',
  pagina_compras: 'Página de compras',
  catalogo_online: 'Catálogo online',
  site_institucional: 'Site institucional',
  agendamento_online: 'Agendamento online',
}

export const SEGMENTOS: Record<string, { nome: string; solucoes: string[] }> = {
  restaurante: { nome: 'Restaurantes', solucoes: ['cardapio_digital', 'pedidos_online', 'comandas'] },
  loja: { nome: 'Lojas', solucoes: ['landing_page', 'pagina_vendas', 'pagina_compras', 'catalogo_online'] },
  servicos: { nome: 'Prestadores de serviços', solucoes: ['landing_page', 'site_institucional', 'agendamento_online'] },
  beleza: { nome: 'Beleza e estética', solucoes: ['agendamento_online', 'landing_page', 'site_institucional'] },
  saude: { nome: 'Saúde', solucoes: ['agendamento_online', 'site_institucional', 'landing_page'] },
  outros: { nome: 'Outros', solucoes: ['landing_page', 'site_institucional', 'catalogo_online'] },
}
