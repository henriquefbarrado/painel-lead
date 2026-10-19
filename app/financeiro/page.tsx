import { Suspense } from 'react'
import Shell from '@/components/Shell'
import Financeiro from '@/components/Financeiro'
export default function Page() { return <Shell><Suspense fallback={null}><Financeiro /></Suspense></Shell> }
