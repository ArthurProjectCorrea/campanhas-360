'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { verifyOtpAction, forgotPasswordAction } from '@/lib/action/password-action'
import { ActionState } from '@/types'

const initialState: ActionState = {}

interface VerifyOtpFormProps {
  email: string
}

export function VerifyOtpForm({ email }: VerifyOtpFormProps) {
  const router = useRouter()

  const [state, formAction, isPending] = useActionState(verifyOtpAction, initialState)
  const [resendState, resendAction, isResending] = useActionState(
    forgotPasswordAction,
    initialState,
  )

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state])

  useEffect(() => {
    if (resendState.message) {
      if (resendState.success) {
        toast.success('Novo código enviado com sucesso!')
      } else {
        toast.error(resendState.message)
      }
    }
  }, [resendState])

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Verificar Código</h1>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para o seu e-mail
        </p>
      </div>

      <form action={formAction}>
        <input type="hidden" name="email" value={email} />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" name="email" type="email" defaultValue={email} disabled required />
          </Field>

          <Field className="flex flex-col items-center gap-4">
            <FieldLabel htmlFor="otp">Código de Verificação</FieldLabel>
            <InputOTP id="otp" name="otp" maxLength={6} disabled={isPending} required>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </Field>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner className="mr-2" />
                Verificando...
              </>
            ) : (
              'Verificar Código'
            )}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex flex-col gap-4 text-center">
        <div className="text-sm">
          Não recebeu o código?{' '}
          <form action={resendAction} className="inline">
            <input type="hidden" name="email" value={email} />
            <button
              type="submit"
              disabled={isResending || isPending}
              className="font-medium text-primary hover:underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
            >
              {isResending ? 'Enviando...' : 'Reenviar Código'}
            </button>
          </form>
        </div>

        <Link
          href="/sign-in"
          className="text-sm font-medium text-primary hover:underline underline-offset-4"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  )
}
