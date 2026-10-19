'use client'
// Mostra uma tela amigável em vez de uma página em branco quando algo quebra.
export default function Erro({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="card max-w-md space-y-3 p-8 text-center">
        <h1 className="text-xl font-bold">Algo deu errado</h1>
        <p className="text-sm text-slate-500">{error.message || 'Erro inesperado.'} Seus dados estão salvos. Tente de novo.</p>
        <div className="flex justify-center gap-2"><button className="btn-p" onClick={reset}>Tentar de novo</button><a className="btn" href="/">Ir para o início</a></div>
      </div>
    </main>
  )
}
