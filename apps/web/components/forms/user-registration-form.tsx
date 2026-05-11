'use client'

import * as React from 'react'
import { useActionState } from 'react'
import { User, AccessProfile } from '@/types'
import { upsertUserAction } from '@/lib/action/user-registration-action'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'

interface UserRegistrationFormProps {
  initialData?: User
  accessProfiles: AccessProfile[]
  disabled?: boolean
  onSuccess?: () => void
  mode: 'create' | 'edit' | 'view'
}

export function UserRegistrationForm({
  initialData,
  accessProfiles,
  disabled = false,
  onSuccess,
  mode,
}: UserRegistrationFormProps) {
  const [state, formAction, isPending] = useActionState(upsertUserAction, {
    success: false,
    message: '',
  })

  const lastMessageRef = React.useRef<string | null>(null)

  React.useEffect(() => {
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

  return (
    <form action={formAction} className="space-y-6">
      {mode !== 'create' && initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div className="grid gap-4">
        <Field>
          <FieldLabel>Nome</FieldLabel>
          <Input name="name" defaultValue={initialData?.name || ''} disabled={disabled} required />
        </Field>

        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input
            name="email"
            type="email"
            defaultValue={initialData?.email || ''}
            disabled={disabled}
            required
          />
        </Field>

        <Field>
          <FieldLabel>Perfil de Acesso</FieldLabel>
          <Select
            name="access_profile_id"
            defaultValue={
              initialData?.accessProfileId?.toString() || initialData?.access_profile_id?.toString()
            }
            disabled={disabled}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil" />
            </SelectTrigger>
            <SelectContent>
              {accessProfiles.map(profile => (
                <SelectItem key={profile.id} value={profile.id.toString()}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <FieldGroup>
          <FieldLabel htmlFor="isActive">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Usuário Ativo</FieldTitle>
                <FieldDescription>Define se o usuário pode acessar o sistema.</FieldDescription>
              </FieldContent>
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={
                  initialData
                    ? initialData.isActive !== undefined
                      ? initialData.isActive
                      : initialData.is_active
                    : true
                }
                disabled={disabled}
              />
            </Field>
          </FieldLabel>
        </FieldGroup>
      </div>

      {!disabled && (
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner className="mr-2" />}
            {mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
          </Button>
        </div>
      )}
    </form>
  )
}
