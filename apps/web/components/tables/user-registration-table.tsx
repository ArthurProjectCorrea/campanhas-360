'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/custom/data-table/data-table'
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { AccessProfile, UserRegistration } from '@/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Eye, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserRegistrationForm } from '@/components/forms/user-registration-form'
import { deleteUserAction } from '@/lib/action/user-registration-action'
import { toast } from 'sonner'
import { DataTableDeleteDialog } from '@/components/custom/data-table/data-table-delete-dialog'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface UserRegistrationTableProps {
  data: UserRegistration[]
  canUpdate?: boolean
  canDelete?: boolean
  canCreate?: boolean
  accessProfiles: AccessProfile[]
}

export function UserRegistrationTable({
  data,
  canUpdate = false,
  canDelete = false,
  canCreate = false,
  accessProfiles,
}: UserRegistrationTableProps) {
  const [currentUser, setCurrentUser] = React.useState<UserRegistration | null>(null)
  const [dialogMode, setDialogMode] = React.useState<'edit' | 'view'>('view')

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditViewDialogOpen, setIsEditViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const [userToDelete, setUserToDelete] = React.useState<UserRegistration | null>(null)

  const handleDelete = async () => {
    if (!userToDelete) return

    const result = await deleteUserAction(userToDelete.id)
    if (result.success) {
      toast.success(result.message)
      setIsDeleteDialogOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  const columns = React.useMemo<ColumnDef<UserRegistration>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
        meta: {
          title: 'Nome',
        },
      },
      {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        meta: {
          title: 'Email',
        },
      },
      {
        id: 'access_profile_name',
        accessorFn: row => row.accessProfileName || row.access_profile_name,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Perfil de Acesso" />,
        meta: {
          title: 'Perfil de Acesso',
        },
      },
      {
        id: 'status',
        accessorFn: row => (row.isActive !== undefined ? row.isActive : row.is_active),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.getValue('status') as boolean
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
        id: 'created_at',
        accessorFn: row => row.createdAt || row.created_at,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Criado em" />,
        cell: ({ row }) => {
          const dateString = row.getValue('created_at') as string
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
          const user = row.original

          return (
            <div className="flex items-center justify-end gap-2">
              {!canUpdate && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setCurrentUser(user)
                        setDialogMode('view')
                        setIsEditViewDialogOpen(true)
                      }}
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
                      onClick={() => {
                        setCurrentUser(user)
                        setDialogMode('edit')
                        setIsEditViewDialogOpen(true)
                      }}
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
                        setUserToDelete(user)
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
    [canUpdate, canDelete],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        toolbar={
          canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setCurrentUser(null)
                setIsCreateDialogOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Registro
            </Button>
          )
        }
      />

      {/* Dialog para Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <UserRegistrationForm
            accessProfiles={accessProfiles}
            mode="create"
            onSuccess={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para Edição/Visualização */}
      <Dialog open={isEditViewDialogOpen} onOpenChange={setIsEditViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'edit' ? 'Editar Usuário' : 'Visualizar Usuário'}
            </DialogTitle>
          </DialogHeader>
          {currentUser && (
            <UserRegistrationForm
              initialData={currentUser}
              accessProfiles={accessProfiles}
              disabled={dialogMode === 'view'}
              mode={dialogMode}
              onSuccess={() => setIsEditViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Reutilizável de Deleção */}
      <DataTableDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={userToDelete?.name}
        title="Excluir usuário?"
        description="Esta ação removerá o acesso do usuário ao sistema."
      />
    </>
  )
}
