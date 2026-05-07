'use client'

import * as React from 'react'
import { Trash2Icon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DataTableDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  itemName?: string
  isPending?: boolean
}

export function DataTableDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Excluir item?',
  description = 'Deseja realmente excluir este item? Esta ação não pode ser desfeita.',
  itemName,
  isPending = false,
}: DataTableDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName ? (
              <>
                Deseja realmente excluir <strong>{itemName}</strong>? {description}
              </>
            ) : (
              description
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault()
              onConfirm()
            }}
            variant="destructive"
            disabled={isPending}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
