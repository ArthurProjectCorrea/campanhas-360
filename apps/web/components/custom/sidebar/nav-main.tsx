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
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          // Converte o nome do ícone de kebab-case para PascalCase se necessário
          const iconName = item.icon
            ?.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('')

          const Icon = iconName
            ? (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName] || Icons.HelpCircle
            : Icons.HelpCircle

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
                  {item.items.map(subItem => (
                    <DropdownMenuItem key={subItem.title} asChild>
                      <Link href={subItem.url || '#'} className="flex w-full items-center">
                        <span>{subItem.title}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
