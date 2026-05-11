'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { InputUpload } from '@/components/custom/input-upload'
import { updateOrganizationAction } from '@/lib/action/organization-profile-action'
import { Client, ActionState } from '@/types'

interface OrganizationProfileFormProps {
  initialData: Client
  lookups: {
    positions: { id: number; name: string }[]
    parties: { id: number; name: string }[]
    municipalities: { id: number; name: string }[]
  }
  canUpdate?: boolean
}

const initialState: ActionState = {}

export function OrganizationProfileForm({
  initialData,
  canUpdate = true,
}: OrganizationProfileFormProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [resetKey, setResetKey] = React.useState(0)
  const [state, formAction, isPending] = useActionState(updateOrganizationAction, initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
      } else {
        toast.error(state.message)
      }
    }
  }, [state])

  const handleDiscard = () => {
    setResetKey(prev => prev + 1)
    router.refresh()
    toast.info('Alterações descartadas.')
  }

  return (
    <form
      key={resetKey}
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start"
    >
      {/* Coluna 1: Dados Principais */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Dados da Organização</CardTitle>
          <CardDescription>Gerencie as informações principais do domínio.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="domain">Domínio da Organização</FieldLabel>
              <Input
                id="domain"
                name="domain"
                defaultValue={initialData.domain}
                placeholder="ex: candidato.com.br"
                required
                disabled={isPending || !canUpdate}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        {canUpdate && (
          <CardFooter className="flex justify-end gap-3 border-t py-2 px-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isPending}
            >
              Descartar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Coluna 2: Upload de Identidade Visual */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Identidade Visual</CardTitle>
          <CardDescription>Personalize a foto oficial do candidato.</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel>Foto do Candidato</FieldLabel>
              <InputUpload
                name="avatar"
                description="JPG, PNG. Máx: 2MB."
                defaultValue={initialData.avatar_url}
                maxSize={2}
                accept="image/*"
                disabled={isPending || !canUpdate}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </form>
  )
}
