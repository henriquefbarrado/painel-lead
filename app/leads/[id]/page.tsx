import Shell from '@/components/Shell'
import LeadDetalhe from '@/components/LeadDetalhe'
export default function Page({ params }: { params: { id: string } }) { return <Shell><LeadDetalhe id={params.id} /></Shell> }
