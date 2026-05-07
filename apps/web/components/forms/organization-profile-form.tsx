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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  lookups,
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
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Coluna 1: Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Organização</CardTitle>
          <CardDescription>
            Gerencie as informações principais e configurações da sua campanha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="candidate_number">Número do Candidato</FieldLabel>
                <Input
                  id="candidate_number"
                  name="candidate_number"
                  type="number"
                  defaultValue={initialData.candidate_number}
                  required
                  disabled={isPending || !canUpdate}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="election_year">Ano Eleitoral</FieldLabel>
                <Input
                  id="election_year"
                  name="election_year"
                  type="number"
                  defaultValue={initialData.election_year}
                  required
                  disabled={isPending || !canUpdate}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="position_id">Cargo em Disputa</FieldLabel>
              <Select
                name="position_id"
                defaultValue={initialData.position_id.toString()}
                disabled={isPending || !canUpdate}
              >
                <SelectTrigger id="position_id">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.positions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id.toString()}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="party_id">Partido Político</FieldLabel>
              <Select
                name="party_id"
                defaultValue={initialData.party_id.toString()}
                disabled={isPending || !canUpdate}
              >
                <SelectTrigger id="party_id">
                  <SelectValue placeholder="Selecione o partido" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.parties.map(party => (
                    <SelectItem key={party.id} value={party.id.toString()}>
                      {party.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="municipality_id">Nome da Unidade Eleitoral</FieldLabel>
              <Select
                name="municipality_id"
                defaultValue={initialData.municipality_id.toString()}
                disabled={isPending || !canUpdate}
              >
                <SelectTrigger id="municipality_id">
                  <SelectValue placeholder="Selecione a unidade" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.municipalities.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
        {canUpdate && (
          <CardFooter className="flex justify-end gap-3 border-t px-6">
            <Button type="button" variant="outline" onClick={handleDiscard} disabled={isPending}>
              Descartar
            </Button>
            <Button type="submit" disabled={isPending}>
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
        <CardHeader>
          <CardTitle>Identidade Visual</CardTitle>
          <CardDescription>
            Personalize a aparência da sua campanha com a foto oficial do candidato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Foto do Candidato</FieldLabel>
              <InputUpload
                name="avatar"
                description="Formatos suportados: JPG, PNG. Tamanho máximo: 2MB."
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
