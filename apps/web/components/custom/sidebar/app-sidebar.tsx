'use client'

import * as React from 'react'

import { NavMain } from '@/components/custom/sidebar/nav-main'
import { NavUser } from '@/components/custom/sidebar/nav-user'
import { ProfileClient } from '@/components/custom/sidebar/profile-client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { getSidebarData } from '@/lib/action/sidebar-action'
import { SidebarData } from '@/types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState<SidebarData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    getSidebarData().then(result => {
      setData(result)
      setIsLoading(false)
    })
  }, [])

  const user = data
    ? {
        name: data.userName,
        email: data.userEmail,
        avatar: '',
      }
    : {
        name: '',
        email: '',
        avatar: '',
      }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProfileClient data={data} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data?.navMain || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} isLoading={isLoading} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
