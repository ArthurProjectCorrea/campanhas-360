'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { InputPassword } from '@/components/custom/input-password'
import { resetPasswordAction } from '@/lib/action/password-action'
import { ActionState } from '@/types'

interface ResetPasswordFormProps {
  email: string
}

const initialState: ActionState = {}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState)

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Definir Nova Senha</h1>
        <p className="text-sm text-muted-foreground">
          Crie uma senha forte para proteger sua conta
        </p>
      </div>
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" name="email" type="email" defaultValue={email} disabled />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Nova Senha</FieldLabel>
            <InputPassword
              id="password"
              name="password"
              placeholder="Digite a nova senha"
              required
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm_password">Confirmar Nova Senha</FieldLabel>
            <InputPassword
              id="confirm_password"
              name="confirm_password"
              placeholder="Confirme a nova senha"
              required
              disabled={isPending}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
