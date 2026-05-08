'use client'

import * as React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/custom/data-table/data-table'
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Campaign, Candidate } from '@/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Plus, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OrganizationProfileCampaignForm } from '@/components/forms/organization-profile-campaign-form'
import { deleteCampaignAction } from '@/lib/action/organization-profile-action'
import { toast } from 'sonner'
import { DataTableDeleteDialog } from '@/components/custom/data-table/data-table-delete-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface OrganizationProfileTableProps {
  data: Campaign[]
  lookups: {
    positions: { id: number; name: string }[]
    parties: { id: number; name: string }[]
    municipalities: { id: number; name: string }[]
    candidates: Candidate[]
  }
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}

export function OrganizationProfileTable({
  data,
  lookups,
  canCreate = false,
  canUpdate = false,
  canDelete = false,
}: OrganizationProfileTableProps) {
  const [currentCampaign, setCurrentCampaign] = React.useState<Campaign | null>(null)
  const [dialogMode, setDialogMode] = React.useState<'update' | 'view'>('view')

  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditViewDialogOpen, setIsEditViewDialogOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const [campaignToDelete, setCampaignToDelete] = React.useState<Campaign | null>(null)

  const handleDelete = async () => {
    if (!campaignToDelete) return

    const formData = new FormData()
    formData.append('id', campaignToDelete.id.toString())

    const result = await deleteCampaignAction(formData)
    if (result.success) {
      toast.success(result.message)
      setIsDeleteDialogOpen(false)
    } else {
      toast.error(result.message)
    }
  }

  const columns = React.useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        id: 'candidate_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Candidato" />,
        accessorFn: row =>
          lookups.candidates.find(c => c.id === row.candidate_id)?.ballot_name || 'Desconhecido',
        meta: {
          title: 'Candidato',
        },
      },
      {
        accessorKey: 'candidate_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Número" />,
        meta: {
          title: 'Número',
        },
      },
      {
        accessorKey: 'election_year',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ano" />,
        meta: {
          title: 'Ano',
        },
      },
      {
        id: 'position',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Cargo" />,
        accessorFn: row => lookups.positions.find(p => p.id === row.position_id)?.name || '-',
        meta: {
          title: 'Cargo',
        },
      },
      {
        id: 'party',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Partido" />,
        accessorFn: row => lookups.parties.find(p => p.id === row.party_id)?.name || '-',
        meta: {
          title: 'Partido',
        },
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.getValue('is_active') as boolean
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Ativa' : 'Inativa'}
            </Badge>
          )
        },
        meta: {
          title: 'Status',
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => {
          const campaign = row.original

          return (
            <div className="flex items-center justify-end gap-2">
              {(!canUpdate || !campaign.is_active) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setCurrentCampaign(campaign)
                        setDialogMode('view')
                        setIsEditViewDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Visualizar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Visualizar (Somente leitura)</TooltipContent>
                </Tooltip>
              )}
              {canUpdate && campaign.is_active && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setCurrentCampaign(campaign)
                        setDialogMode('update')
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
                        setCampaignToDelete(campaign)
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
    [canUpdate, canDelete, lookups],
  )

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        toolbar={
          canCreate && (
            <Button
              size="sm"
              onClick={() => {
                setCurrentCampaign(null)
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Campanha</DialogTitle>
          </DialogHeader>
          <OrganizationProfileCampaignForm
            lookups={lookups}
            mode="create"
            onSuccess={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para Edição/Visualização */}
      <Dialog open={isEditViewDialogOpen} onOpenChange={setIsEditViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'update' ? 'Editar Campanha' : 'Visualizar Campanha'}
            </DialogTitle>
          </DialogHeader>
          {currentCampaign && (
            <OrganizationProfileCampaignForm
              initialData={currentCampaign}
              lookups={lookups}
              mode={dialogMode}
              disabled={dialogMode === 'view'}
              onSuccess={() => setIsEditViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Deleção */}
      <DataTableDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={`a campanha de ${
          lookups.candidates.find(c => c.id === campaignToDelete?.candidate_id)?.ballot_name || ''
        }`}
        title="Excluir campanha?"
        description="Esta ação removerá permanentemente o registro da campanha."
      />
    </>
  )
}
