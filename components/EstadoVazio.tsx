export default function EstadoVazio({ icone, titulo, texto, children }: { icone: React.ReactNode; titulo: string; texto?: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600">{icone}</div>
      <h3 className="font-semibold">{titulo}</h3>
      {texto && <p className="max-w-sm text-sm text-slate-500">{texto}</p>}
      {children && <div className="mt-2 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  )
}
