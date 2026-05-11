'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { forgotPasswordAction } from '@/lib/action/password-action'
import { ActionState } from '@/types'

const initialState: ActionState = {}

export function ForgotPasswordForm() {
  const router = useRouter()
  const emailRef = React.useRef<HTMLInputElement>(null)
  const [isRedirecting, setIsRedirecting] = React.useState(false)
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState)

  const isLoading = isPending || isRedirecting

  useEffect(() => {
    if (state.success) {
      setTimeout(() => setIsRedirecting(true), 0)
      toast.success(state.message)
      const timer = setTimeout(() => router.push('/verify-otp'), 1500)
      return () => clearTimeout(timer)
    }
    if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, router])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
        <p className="text-sm text-muted-foreground">
          Informe seu e-mail para receber um código de recuperação
        </p>
      </div>
      <form action={formAction}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              required
              disabled={isLoading}
            />
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner className="mr-2" />
                Enviando...
              </>
            ) : (
              'Enviar Código'
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Voltar para o login
            </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
