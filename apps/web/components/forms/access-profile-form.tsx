'use client'

import * as React from 'react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  FieldDescription,
  FieldContent,
} from '@/components/ui/field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { FormButtons } from '@/components/layout/form-button'
import { createAccessProfile, updateAccessProfile } from '@/lib/action/access-profile-action'
import { AccessProfile, Screen, Permission, ActionState, Access } from '@/types'

interface AccessProfileFormProps {
  initialData?: AccessProfile & { accesses: Access[] }
  lookups: {
    screens: Screen[]
    permissions: Permission[]
  }
  canUpdate?: boolean
  mode: 'create' | 'edit' | 'view'
  domain: string
}

const initialState: ActionState = {}

const SCREEN_PERMISSIONS_MAPPING: Record<string, string[]> = {
  organization_profile: ['view', 'update', 'create', 'delete'],
  user_registration: ['view', 'update', 'create', 'delete'],
  access_profile: ['view', 'update', 'create', 'delete'],
  regional_planning: ['view', 'update', 'create', 'delete'],
}

const GLOBAL_PERMISSIONS_MAPPING: Record<string, string[]> = {
  dashboard: ['view'],
}

export function AccessProfileForm({ initialData, lookups, mode, domain }: AccessProfileFormProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [resetKey, setResetKey] = useState(0)

  // Estado para controlar as permissões selecionadas (Matriz)
  const [selectedPermissions, setSelectedPermissions] = useState<
    { screen_id: number; permission_id: number }[]
  >(
    initialData?.accesses.map(a => ({ screen_id: a.screen_id, permission_id: a.permission_id })) ||
      [],
  )

  const action = mode === 'create' ? createAccessProfile : updateAccessProfile
  const [state, formAction, isPending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        router.push(`/${domain}/settings/access-profile`)
      } else {
        toast.error(state.message)
      }
    }
  }, [state, domain, router])

  const handleTogglePermission = (screenId: number, permissionId: number) => {
    if (mode === 'view') return

    setSelectedPermissions(prev => {
      const exists = prev.find(p => p.screen_id === screenId && p.permission_id === permissionId)
      if (exists) {
        return prev.filter(p => !(p.screen_id === screenId && p.permission_id === permissionId))
      }
      return [...prev, { screen_id: screenId, permission_id: permissionId }]
    })
  }

  const isChecked = (screenId: number, permissionId: number) => {
    return !!selectedPermissions.find(
      p => p.screen_id === screenId && p.permission_id === permissionId,
    )
  }

  const isPermissionAllowed = (screenKey: string, permissionKey: string) => {
    return SCREEN_PERMISSIONS_MAPPING[screenKey]?.includes(permissionKey)
  }

  const handleDiscard = () => {
    if (formRef.current) {
      formRef.current.reset()
      setSelectedPermissions(
        initialData?.accesses.map(a => ({
          screen_id: a.screen_id,
          permission_id: a.permission_id,
        })) || [],
      )
      setResetKey(prev => prev + 1)
    }
  }

  // Filtrar telas para remover as globais
  const visibleScreens = lookups.screens.filter(screen => !GLOBAL_PERMISSIONS_MAPPING[screen.key])

  // Preparar permissões para envio (incluindo as globais)
  const handleSubmit = (formData: FormData) => {
    const permissionsWithGlobals = [...selectedPermissions]

    // Adicionar permissões globais
    Object.entries(GLOBAL_PERMISSIONS_MAPPING).forEach(([screenKey, permissionKeys]) => {
      const screen = lookups.screens.find(s => s.key === screenKey)
      if (screen) {
        permissionKeys.forEach(pKey => {
          const permission = lookups.permissions.find(p => p.key === pKey)
          if (permission) {
            const alreadyExists = permissionsWithGlobals.some(
              p => p.screen_id === screen.id && p.permission_id === permission.id,
            )
            if (!alreadyExists) {
              permissionsWithGlobals.push({ screen_id: screen.id, permission_id: permission.id })
            }
          }
        })
      }
    })

    formData.set('permissions', JSON.stringify(permissionsWithGlobals))
    formAction(formData)
  }

  const disabled = mode === 'view' || isPending

  return (
    <form
      ref={formRef}
      key={resetKey}
      action={handleSubmit}
      className="grid grid-cols-1 gap-6 pb-24"
    >
      {mode !== 'create' && initialData && <input type="hidden" name="id" value={initialData.id} />}

      {/* Input oculto para enviar a matriz de permissões como JSON */}
      <input type="hidden" name="permissions" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Dados do Perfil */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Perfil</CardTitle>
              <CardDescription>
                Defina o nome e o status global deste perfil de acesso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Field>
                <FieldLabel htmlFor="name">Nome do Perfil</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  placeholder="Ex: Gerente Financeiro"
                  required
                  disabled={disabled}
                />
              </Field>

              <FieldGroup>
                <FieldLabel htmlFor="is_active">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Perfil Ativo</FieldTitle>
                      <FieldDescription>
                        Define se este perfil pode ser atribuído a novos usuários.
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={initialData ? initialData.is_active : true}
                      disabled={disabled}
                    />
                  </Field>
                </FieldLabel>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>

        {/* Card 2: Matriz de Permissões */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões</CardTitle>
              <CardDescription>
                Selecione as ações permitidas para cada tela do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-full">Tela</TableHead>
                      {lookups.permissions.map(permission => (
                        <TableHead
                          key={permission.id}
                          className="text-center w-24 min-w-[96px] whitespace-nowrap"
                        >
                          {permission.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleScreens.map(screen => (
                      <TableRow key={screen.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{screen.sidebar || screen.title}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              {screen.key}
                            </span>
                          </div>
                        </TableCell>
                        {lookups.permissions.map(permission => {
                          const isAllowed = isPermissionAllowed(screen.key, permission.key)
                          return (
                            <TableCell
                              key={permission.id}
                              className="text-center w-24 min-w-[96px]"
                            >
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={isChecked(screen.id, permission.id)}
                                  onCheckedChange={() =>
                                    handleTogglePermission(screen.id, permission.id)
                                  }
                                  disabled={disabled || !isAllowed}
                                  className={!isAllowed ? 'opacity-20' : ''}
                                />
                              </div>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FormButtons
        isPending={isPending}
        mode={mode}
        onDiscard={handleDiscard}
        backUrl={`/${domain}/settings/access-profile`}
      />
    </form>
  )
}
