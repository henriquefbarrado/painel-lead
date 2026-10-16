export default function PageHeader({ titulo, sub, icone, children }: { titulo: string; sub: string; icone: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-soft">
      <div className="pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">{icone}</div>
          <div><h1 className="text-2xl font-bold tracking-tight">{titulo}</h1><p className="text-sm text-indigo-100">{sub}</p></div>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </div>
  )
}
