import { AppSidebar } from '@/components/custom/sidebar/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
