import { Suspense } from 'react'
import Shell from '@/components/Shell'
import Painel from '@/components/Painel'
export default function Page() { return <Shell><Suspense fallback={null}><Painel /></Suspense></Shell> }
