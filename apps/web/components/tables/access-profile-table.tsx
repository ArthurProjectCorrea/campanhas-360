'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/custom/data-table/data-table'
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { AccessProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { DataTableDeleteDialog } from '@/components/custom/data-table/data-table-delete-dialog'
import { deleteAccessProfile } from '@/lib/action/access-profile-action'
import { toast } from 'sonner'

interface AccessProfileTableProps {
  data: AccessProfile[]
  canUpdate?: boolean
  canDelete?: boolean
  canCreate?: boolean
  domain: string
}

export function AccessProfileTable({
  data,
  canUpdate = false,
  canDelete = false,
  canCreate = false,
  domain,
}: AccessProfileTableProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [profileToDelete, setProfileToDelete] = React.useState<AccessProfile | null>(null)
  const [isDeletePending, setIsDeletePending] = React.useState(false)

  const handleDelete = async () => {
    if (!profileToDelete) return

    setIsDeletePending(true)
    const result = await deleteAccessProfile(profileToDelete.id)
    setIsDeletePending(false)

    if (result.success) {
      toast.success(result.message)
      setIsDeleteDialogOpen(false)
      setProfileToDelete(null)
    } else {
      toast.error(result.message)
    }
  }

  const columns = React.useMemo<ColumnDef<AccessProfile>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
        meta: {
          title: 'Nome',
        },
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          )
        },
        meta: {
          title: 'Status',
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
        cell: ({ row }) => {
          const dateString = row.getValue('createdAt') as string
          if (!dateString) return '-'
          const date = new Date(dateString)

          const formattedDate = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }).format(date)

          const formattedTime = new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(date)

          return `${formattedDate} - ${formattedTime}`
        },
        meta: {
          title: 'Criado em',
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const profile = row.original

          return (
            <div className="flex items-center justify-end gap-2">
              {!canUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        router.push(`/${domain}/settings/access-profile/${profile.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Visualizar</TooltipContent>
                </Tooltip>
              )}
              {canUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        router.push(`/${domain}/settings/access-profile/${profile.id}`)
                      }
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        setProfileToDelete(profile)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Deletar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Deletar</TooltipContent>
                </Tooltip>
              )}
            </div>
          )
        },
      },
    ],
    [canUpdate, canDelete, domain, router],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        toolbar={
          canCreate && (
            <Button size="sm" onClick={() => router.push(`/${domain}/settings/access-profile/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Perfil
            </Button>
          )
        }
      />
      <DataTableDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={profileToDelete?.name}
        isPending={isDeletePending}
      />
    </>
  )
}
