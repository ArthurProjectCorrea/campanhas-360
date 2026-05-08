'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { EllipsisVertical } from 'lucide-react'
import * as Icons from 'lucide-react'
import { NavMainItem } from '@/types'

export function NavMain({ items }: { items: NavMainItem[] }) {
  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.HelpCircle

    const pascalIconName = iconName
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    return (
      (Icons as unknown as Record<string, Icons.LucideIcon>)[pascalIconName] || Icons.HelpCircle
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          const Icon = getIcon(item.icon)

          // Se for um item simples (sem sub-itens)
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.url || '#'}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }

          // Se for um grupo com sub-itens, usa DropdownMenu
          return (
            <SidebarMenuItem key={item.title}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                    <EllipsisVertical className="ml-auto size-4 opacity-50" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-48">
                  {item.items.map(subItem => {
                    const SubIcon = getIcon(subItem.icon)
                    return (
                      <DropdownMenuItem key={subItem.title} asChild>
                        <Link href={subItem.url || '#'} className="flex w-full items-center gap-2">
                          <SubIcon className="size-4" />
                          <span>{subItem.title}</span>
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
