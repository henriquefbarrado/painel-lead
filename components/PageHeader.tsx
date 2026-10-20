export default function PageHeader({ titulo, sub, icone, children }: { titulo: string; sub: string; icone: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-600 [&>svg]:h-5 [&>svg]:w-5">{icone}</div>
        <div><h1 className="text-xl font-semibold tracking-tight">{titulo}</h1><p className="text-sm text-slate-500">{sub}</p></div>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}
