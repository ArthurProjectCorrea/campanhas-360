'use client'

import * as React from 'react'
import { Building2Icon, MapPinIcon, UserStar } from 'lucide-react'
import Image from 'next/image'

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

import { Badge } from '@/components/ui/badge'
import { SidebarData } from '@/types'

export function ProfileClient({ data }: { data: SidebarData | null }) {
  if (!data) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <UserStar className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{data.ballot_name}</span>
                <span className="truncate text-xs">
                  {data.position_name} • {data.party_slug}
                </span>
              </div>
            </SidebarMenuButton>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            className="w-80 p-0 overflow-hidden border-none shadow-2xl"
          >
            <div className="flex h-44 bg-card">
              <div className="relative w-32 shrink-0 bg-muted">
                {data.avatar_url ? (
                  <Image
                    src={data.avatar_url}
                    alt={data.ballot_name}
                    fill
                    className="object-cover object-top"
                    sizes="128px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <UserStar className="size-10 opacity-20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-card/10" />
              </div>
              <div className="flex flex-1 flex-col justify-center p-4 space-y-1.5 overflow-hidden relative">
                <Badge
                  variant="outline"
                  className="absolute top-3 right-3 px-1.5 py-0 text-[10px] h-4.5 border-primary/20 font-bold bg-primary/5 text-primary/80 shrink-0"
                >
                  {data.party_slug}
                </Badge>

                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold leading-tight truncate pr-10">
                    {data.ballot_name}
                  </h4>
                  <p className="text-[11px] font-bold text-primary/90 uppercase tracking-tighter">
                    {data.position_name} — {data.candidate_number}
                  </p>
                </div>

                <div className="grid gap-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-start">
                    <Building2Icon className="mr-1.5 size-3 opacity-60 shrink-0 mt-0.5" />
                    <span className="text-[10px] opacity-70 leading-tight">{data.party_name}</span>
                  </div>
                  <div className="flex items-center font-medium">
                    <MapPinIcon className="mr-1.5 size-3 opacity-60 shrink-0" />
                    <span className="truncate text-foreground/80">{data.municipality_name}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <Badge className="text-[9px] h-4 px-1.5 bg-primary/10 text-primary border-none hover:bg-primary/15 font-bold">
                    ELEIÇÃO {data.election_year}
                  </Badge>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
