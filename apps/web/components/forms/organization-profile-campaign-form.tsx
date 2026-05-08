'use client'

import * as React from 'react'
import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import {
  createCampaignAction,
  updateCampaignAction,
} from '@/lib/action/organization-profile-action'
import { Campaign, ActionState, Candidate } from '@/types'

interface OrganizationProfileCampaignFormProps {
  initialData?: Campaign
  lookups: {
    positions: { id: number; name: string }[]
    parties: { id: number; name: string }[]
    municipalities: { id: number; name: string }[]
    candidates: Candidate[]
  }
  mode: 'create' | 'update' | 'view'
  onSuccess?: () => void
  disabled?: boolean
}

const initialState: ActionState = {}

export function OrganizationProfileCampaignForm({
  initialData,
  lookups,
  mode,
  onSuccess,
  disabled = false,
}: OrganizationProfileCampaignFormProps) {
  const action = mode === 'create' ? createCampaignAction : updateCampaignAction
  const [state, formAction, isPending] = useActionState(action, initialState)
  const [formData, setFormData] = React.useState({
    legal_spending_limit: ((initialData?.legal_spending_limit || 0) * 100).toString(),
  })

  const lastMessageRef = useRef<string | null>(null)

  useEffect(() => {
    if (state.message && state.message !== lastMessageRef.current) {
      if (state.success) {
        toast.success(state.message)
        onSuccess?.()
      } else {
        toast.error(state.message)
      }
      lastMessageRef.current = state.message
    }
  }, [state, onSuccess])

  const isDisabled = disabled || isPending

  return (
    <form action={formAction} className="space-y-6">
      {mode !== 'create' && initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid gap-4">
        <Field>
          <FieldLabel>Candidato</FieldLabel>
          <Select
            name="candidate_id"
            defaultValue={initialData?.candidate_id?.toString()}
            disabled={isDisabled}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o candidato" />
            </SelectTrigger>
            <SelectContent>
              {lookups.candidates.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  {c.ballot_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel>Número</FieldLabel>
            <Input
              name="candidate_number"
              type="number"
              defaultValue={initialData?.candidate_number}
              disabled={isDisabled}
              required
            />
          </Field>
          <Field>
            <FieldLabel>Ano</FieldLabel>
            <Input
              name="election_year"
              type="number"
              defaultValue={initialData?.election_year}
              disabled={isDisabled}
              required
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Cargo</FieldLabel>
          <Select
            name="position_id"
            defaultValue={initialData?.position_id?.toString()}
            disabled={isDisabled}
            required
          >
            <SelectTrigger>
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
          <FieldLabel>Partido</FieldLabel>
          <Select
            name="party_id"
            defaultValue={initialData?.party_id?.toString()}
            disabled={isDisabled}
            required
          >
            <SelectTrigger>
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
          <FieldLabel>Unidade Eleitoral</FieldLabel>
          <Select
            name="municipality_id"
            defaultValue={initialData?.municipality_id?.toString()}
            disabled={isDisabled}
            required
          >
            <SelectTrigger>
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

        <Field>
          <FieldLabel>Limite Legal de Gastos</FieldLabel>
          <Input
            name="legal_spending_limit_display"
            value={new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(Number(formData.legal_spending_limit || 0) / 100)}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '')
              setFormData({ ...formData, legal_spending_limit: val })
            }}
            disabled={isDisabled}
            required
          />
          <input type="hidden" name="legal_spending_limit" value={formData.legal_spending_limit} />
        </Field>

        <FieldGroup>
          <FieldLabel htmlFor="is_active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Campanha Ativa</FieldTitle>
                <FieldDescription>
                  Define se esta é a campanha principal da organização.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={initialData ? initialData.is_active : true}
                disabled={isDisabled}
              />
            </Field>
          </FieldLabel>
        </FieldGroup>
      </div>

      {!disabled && mode !== 'view' && (
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="mr-2" />}
            {mode === 'create' ? 'Criar Campanha' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </form>
  )
}
