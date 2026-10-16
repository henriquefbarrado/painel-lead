import { createBrowserClient } from '@supabase/ssr'

// Aceita os dois nomes de variável: ANON_KEY (antigo) ou PUBLISHABLE_KEY (novo do Supabase).
// As referências precisam ser literais para o Next embutir o valor no navegador.
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabase = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!)
