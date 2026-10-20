import './globals.css'
export const metadata = { title: 'Painel de Leads' }
const initTema = "try{if(localStorage.getItem('tema')!=='claro')document.documentElement.classList.add('dark')}catch(e){}"
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: initTema }} />
      </head>
      <body className="text-slate-900 antialiased">{children}</body>
    </html>
  )
}
