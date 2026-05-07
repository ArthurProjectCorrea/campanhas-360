'use client'

import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import { Table } from '@tanstack/react-table'
import { Columns2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto hidden h-8 w-8 lg:flex">
              <Columns2 className="h-4 w-4" />
              <span className="sr-only">Colunas</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Colunas</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[max-content]">
        <DropdownMenuLabel>Alternar colunas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map(column => {
            const title = (column.columnDef.meta as { title?: string })?.title || column.id
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={value => column.toggleVisibility(!!value)}
              >
                {title}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
