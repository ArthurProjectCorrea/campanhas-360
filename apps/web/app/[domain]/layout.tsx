import { AppSidebar } from '@/components/custom/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { verifySessionWithApi } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function DomainLayout({ children }: { children: React.ReactNode }) {
  // Valida a sessão diretamente com a API (Redis) ao entrar no domínio
  const session = await verifySessionWithApi()

  if (!session) {
    redirect('/sign-in')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
