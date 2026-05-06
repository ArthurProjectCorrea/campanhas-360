'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { InputPassword } from '@/components/custom/input-password'
import { signInAction } from '@/lib/action/sign-in-action'
import { ActionState } from '@/types'

const initialState: ActionState = {}

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Digite seu e-mail abaixo para acessar sua conta
        </p>
      </div>
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              required
              disabled={isPending}
            />
          </Field>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Esqueceu sua senha?
              </Link>
            </div>
            <InputPassword
              id="password"
              name="password"
              placeholder="Digite sua senha"
              required
              disabled={isPending}
            />
          </Field>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
