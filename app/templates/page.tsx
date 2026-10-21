import { redirect } from 'next/navigation'

// A área de modelos de mensagem foi removida. Mantemos a rota antiga
// redirecionando para o Pipeline para que links salvos não quebrem.
export default function Page() {
  redirect('/pipeline')
}
