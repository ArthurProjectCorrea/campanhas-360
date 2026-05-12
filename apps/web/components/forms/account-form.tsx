'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { getProfile, updateProfile } from '@/lib/action/account-action'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function AccountForm({ className }: React.ComponentProps<'form'>) {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    name: string
    email: string
    accessProfileName: string
  } | null>(null)

  const [state, formAction, isPending] = React.useActionState(updateProfile, {
    success: false,
    message: '',
  })

  React.useEffect(() => {
    async function loadData() {
      const result = await getProfile()
      if (result) {
        setData(result)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      // Recarrega a página para atualizar os dados no sidebar e em outros componentes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <form action={formAction} className={cn('grid items-start gap-6', className)}>
      <Field>
        <FieldLabel htmlFor="name">Nome</FieldLabel>
        <FieldContent>
          <Input id="name" name="name" defaultValue={data?.name} placeholder="Seu nome" required />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <FieldContent>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={data?.email}
            placeholder="seu@email.com"
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="profile">Perfil de Acesso</FieldLabel>
        <FieldContent>
          <Input id="profile" value={data?.accessProfileName} disabled className="bg-muted" />
        </FieldContent>
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  )
}
