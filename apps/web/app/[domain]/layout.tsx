import { AppSidebar } from '@/components/custom/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import NextTopLoader from 'nextjs-toploader'
export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 pt-0">
          <NextTopLoader showSpinner={false} />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
