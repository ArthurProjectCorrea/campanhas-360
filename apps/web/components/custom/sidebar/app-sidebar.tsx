'use client'

import * as React from 'react'

import { NavMain } from '@/components/custom/sidebar/nav-main'
import { NavProjects } from '@/components/custom/sidebar/nav-projects'
import { NavUser } from '@/components/custom/sidebar/nav-user'
import { ProfileClient } from '@/components/custom/sidebar/profile-client'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { data as sidebarData } from '@/lib/sidebar'
import { getSidebarData } from '@/lib/action/sidebar-action'
import { SidebarData } from '@/types'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState<SidebarData | null>(null)

  React.useEffect(() => {
    getSidebarData().then(setData)
  }, [])

  const user = data
    ? {
        name: data.user_name,
        email: data.user_email,
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
        <NavMain items={sidebarData.navMain} />
        <NavProjects projects={sidebarData.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
