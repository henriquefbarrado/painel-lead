import './globals.css'
export const metadata = { title: 'Painel de Leads' }
const initTema = "try{if(localStorage.getItem('tema')!=='claro')document.documentElement.classList.add('dark')}catch(e){}"
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initTema }} /></head>
      <body className="text-slate-900 antialiased">{children}</body>
    </html>
  )
}
