'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTablePagination } from './data-table-pagination'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  toolbar?: React.ReactNode
  className?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  toolbar,
  className,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const [isReloading, setIsReloading] = React.useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const handleReload = () => {
    setIsReloading(true)
    router.refresh()
    setTimeout(() => {
      setIsReloading(false)
    }, 2000)
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          {searchKey && (
            <Input
              placeholder={`Filtrar por ${searchKey}...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={event => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
              className="max-w-sm h-8"
            />
          )}
          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleReload}
                disabled={isReloading}
              >
                <RefreshCw className={cn('h-4 w-4', isReloading && 'animate-spin')} />
                <span className="sr-only">Recarregar</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Recarregar</TooltipContent>
          </Tooltip>

          <DataTableViewOptions table={table} />
          {toolbar}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: header.id === 'actions' ? '100px' : header.getSize(),
                          minWidth: header.id === 'actions' ? '100px' : undefined,
                        }}
                        className={cn(header.id === 'actions' && 'text-right')}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isReloading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.id === 'actions' ? '100px' : cell.column.getSize(),
                          minWidth: cell.column.id === 'actions' ? '100px' : undefined,
                        }}
                        className={cn(cell.column.id === 'actions' && 'text-right')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>
    </TooltipProvider>
  )
}
