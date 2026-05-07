'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldContent } from '@/components/ui/field'
import { getAccountData, updateAccountAction } from '@/lib/action/account-action'
import { toast } from 'sonner'
import { Loader2Icon } from 'lucide-react'

export function AccountForm({ className }: React.ComponentProps<'form'>) {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    user: { name: string; email: string }
    profileName: string
  } | null>(null)

  const [state, formAction, isPending] = React.useActionState(updateAccountAction, {
    success: false,
    message: '',
  })

  React.useEffect(() => {
    async function loadData() {
      const result = await getAccountData()
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
      <div className="flex h-40 items-center justify-center">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form action={formAction} className={cn('grid items-start gap-6', className)}>
      <Field>
        <FieldLabel htmlFor="name">Nome</FieldLabel>
        <FieldContent>
          <Input
            id="name"
            name="name"
            defaultValue={data?.user.name}
            placeholder="Seu nome"
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="email">E-mail</FieldLabel>
        <FieldContent>
          <Input
            type="email"
            id="email"
            name="email"
            defaultValue={data?.user.email}
            placeholder="seu@email.com"
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel htmlFor="profile">Perfil de Acesso</FieldLabel>
        <FieldContent>
          <Input id="profile" value={data?.profileName} disabled className="bg-muted" />
        </FieldContent>
      </Field>

      <Button type="submit" disabled={isPending}>
        {isPending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  )
}
