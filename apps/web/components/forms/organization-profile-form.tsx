'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, ChevronsUpDown, Plus, X, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/custom/date-picker'
import { InputUploadInline } from '@/components/custom/input-upload'
import { FormButtons } from '@/components/layout/form-button'
import { organizationProfileAction } from '@/lib/action/organization-profile-action'
import {
  ActionState,
  StateMetadata,
  PositionMetadata,
  MunicipalityMetadata,
  PartyMetadata,
  OrganizationProfileData,
} from '@/types'

// ─── Helpers & Constants ──────────────────────────────────────────────────────

function maskCPF(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

// ─── Componente Interno: Seletor de Localização ───────────────────────────────

interface LocationSelectorProps {
  positionId: string
  defaultValue?: string
  defaultStateId?: number
  defaultMunicipalityId?: number
  onChange: (values: { stateId?: string; municipalityId?: string }, label: string) => void
  disabled?: boolean
  states: StateMetadata[]
  positions: PositionMetadata[]
}

function LocationSelector({
  positionId,
  defaultValue,
  defaultStateId,
  defaultMunicipalityId,
  onChange,
  disabled,
  states = [],
  positions = [],
}: LocationSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [openState, setOpenState] = React.useState(false)
  const [municipalities, setMunicipalities] = React.useState<MunicipalityMetadata[]>([])
  const [loadingMunicipalities, setLoadingMunicipalities] = React.useState(false)

  // Encontrar o cargo para saber o escopo
  const position = positions.find(p => p.id.toString() === positionId)
  const scope = position?.type?.toLowerCase() || 'municipal'

  const [confirmedLabel, setConfirmedLabel] = React.useState(defaultValue || 'Selecionar local...')
  const [tempStateId, setTempStateId] = React.useState<string>(defaultStateId?.toString() || '')
  const [tempMunicipalityId, setTempMunicipalityId] = React.useState<string>(
    defaultMunicipalityId?.toString() || '',
  )

  const prevPositionId = React.useRef(positionId)
  const [prevDefaultValue, setPrevDefaultValue] = React.useState(defaultValue)
  const [prevDefaultStateId, setPrevDefaultStateId] = React.useState(defaultStateId)
  const [prevDefaultMunicipalityId, setPrevDefaultMunicipalityId] =
    React.useState(defaultMunicipalityId)

  // Sincronizar com default props se mudarem (ex: ao trocar campanha na paginação)
  if (
    defaultValue !== prevDefaultValue ||
    defaultStateId !== prevDefaultStateId ||
    defaultMunicipalityId !== prevDefaultMunicipalityId
  ) {
    setPrevDefaultValue(defaultValue)
    setPrevDefaultStateId(defaultStateId)
    setPrevDefaultMunicipalityId(defaultMunicipalityId)

    if (defaultValue) setConfirmedLabel(defaultValue)
    if (defaultStateId) setTempStateId(defaultStateId.toString())
    if (defaultMunicipalityId) setTempMunicipalityId(defaultMunicipalityId.toString())
  }

  // Resetar ao trocar de cargo
  React.useEffect(() => {
    if (prevPositionId.current !== positionId) {
      Promise.resolve().then(() => {
        setTempStateId('')
        setTempMunicipalityId('')
        setConfirmedLabel('Selecionar local...')
        onChange({}, 'Selecionar local...')
      })
      prevPositionId.current = positionId
    }
  }, [positionId, onChange])

  // Buscar municípios ao trocar de estado
  React.useEffect(() => {
    console.log('LocationSelector effect:', { scope, tempStateId })
    if (scope === 'municipal' && tempStateId) {
      Promise.resolve().then(() => setLoadingMunicipalities(true))
      console.log('Fetching municipalities for state:', tempStateId)
      fetch(`/metadata/municipalities?stateId=${tempStateId}`)
        .then(res => {
          console.log('Fetch response status:', res.status)
          return res.json()
        })
        .then(data => {
          console.log('Municipalities loaded:', data.length)
          setMunicipalities(data)
          setLoadingMunicipalities(false)
        })
        .catch(err => {
          console.error('Error loading municipalities:', err)
          setLoadingMunicipalities(false)
        })
    }
  }, [tempStateId, scope])

  const canSave =
    scope === 'federal' ||
    (scope === 'estadual' && tempStateId) ||
    (scope === 'municipal' && tempStateId && tempMunicipalityId)

  const handleSave = () => {
    if (!canSave) return

    let label = ''
    const values: { stateId?: string; municipalityId?: string } = {}

    if (scope === 'federal') {
      label = 'Nacional (Brasil)'
      // No IDs for federal
    } else if (scope === 'estadual') {
      const state = states.find(s => s.id.toString() === tempStateId)
      label = state?.name || ''
      values.stateId = tempStateId
    } else {
      const state = states.find(s => s.id.toString() === tempStateId)
      const muni = municipalities.find(m => m.id.toString() === tempMunicipalityId)
      label = `${muni?.name} - ${state?.acronym}`
      values.stateId = tempStateId
      values.municipalityId = tempMunicipalityId
    }

    setConfirmedLabel(label)
    onChange(values, label)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start font-normal text-left truncate',
            confirmedLabel === 'Selecionar local...' && 'text-muted-foreground',
          )}
          disabled={!positionId || disabled}
        >
          {confirmedLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="font-medium leading-none">Abrangência</h4>
            <p className="text-sm text-muted-foreground">
              {scope === 'federal'
                ? 'Cargos federais atuam em todo o país.'
                : scope === 'estadual'
                  ? 'Selecione o estado de atuação.'
                  : 'Selecione o estado e o município.'}
            </p>
          </div>
          <div className="grid gap-3">
            {scope !== 'federal' && (
              <div className="grid gap-1.5">
                <label className="text-xs font-medium">Estado</label>
                <Popover open={openState} onOpenChange={setOpenState}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openState}
                      className="h-8 w-full justify-between font-normal"
                    >
                      {tempStateId
                        ? states.find(s => s.id.toString() === tempStateId)?.name
                        : 'Selecione o estado'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Pesquisar estado..." className="h-8" />
                      <CommandList className="max-h-40">
                        <CommandEmpty>Estado não encontrado.</CommandEmpty>
                        <CommandGroup>
                          {states.map(s => (
                            <CommandItem
                              key={s.id}
                              value={`${s.name} ${s.acronym}`}
                              onSelect={() => {
                                setTempStateId(s.id.toString())
                                setOpenState(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  tempStateId === s.id.toString() ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {s.name} ({s.acronym})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {scope === 'municipal' && (
              <div className="grid gap-1.5">
                <label className="text-xs font-medium">Município</label>
                <Command className="border rounded-md">
                  <CommandInput
                    placeholder={
                      !tempStateId
                        ? 'Selecione um estado primeiro...'
                        : loadingMunicipalities
                          ? 'Carregando...'
                          : 'Pesquisar cidade...'
                    }
                    disabled={!tempStateId || loadingMunicipalities}
                  />
                  <CommandList className="max-h-32">
                    {!tempStateId ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Selecione um estado para listar as cidades.
                      </div>
                    ) : loadingMunicipalities ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Carregando cidades...
                      </div>
                    ) : municipalities.length === 0 ? (
                      <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {municipalities.map(muni => (
                          <CommandItem
                            key={muni.id}
                            value={muni.name}
                            onSelect={() => setTempMunicipalityId(muni.id.toString())}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                tempMunicipalityId === muni.id.toString()
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {muni.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </div>
            )}

            {scope === 'federal' && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
                Atuação em todo o território nacional.
              </div>
            )}
          </div>
          <Button size="sm" onClick={handleSave} disabled={!canSave}>
            Confirmar Local
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── Componente Interno: Seletor de Partido ───────────────────────────────────

interface PartySelectorProps {
  parties: PartyMetadata[]
  defaultValue?: string
  disabled?: boolean
  name: string
}

function PartySelector({ parties, defaultValue, disabled, name }: PartySelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue || '')
  const [prevDefaultValue, setPrevDefaultValue] = React.useState(defaultValue)

  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue)
    if (defaultValue) setValue(defaultValue)
  }

  const selectedParty = parties.find(p => p.id.toString() === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-left truncate"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedParty
              ? `${selectedParty.name} (${selectedParty.acronym})`
              : 'Selecione o partido...'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Pesquisar partido..." />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>Nenhum partido encontrado.</CommandEmpty>
            <CommandGroup>
              {parties.map(party => (
                <CommandItem
                  key={party.id}
                  value={`${party.name} ${party.acronym}`}
                  onSelect={() => {
                    setValue(party.id.toString())
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === party.id.toString() ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {party.name} ({party.acronym})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" name={name} value={value} />
    </Popover>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OrganizationProfileFormProps {
  data: OrganizationProfileData
  domain: string
}

const initialState: ActionState = {}

// ─── Componente ───────────────────────────────────────────────────────────────

export function OrganizationProfileForm({ data, domain }: OrganizationProfileFormProps) {
  const router = useRouter()
  const formRef = React.useRef<HTMLFormElement>(null)

  const { candidate, campaigns: apiCampaigns, permissions } = data
  const canUpdate = permissions.canUpdate
  const canCreate = permissions.canCreate

  const [resetKey, setResetKey] = React.useState(0)
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [showNewCampaignDialog, setShowNewCampaignDialog] = React.useState(false)
  const [campaignPage, setCampaignPage] = React.useState(0)
  const [spendingRaw, setSpendingRaw] = React.useState('')
  const [cpfValue, setCpfValue] = React.useState(candidate?.cpf || '')
  const [birthDate, setBirthDate] = React.useState<Date | undefined>(
    candidate?.birthDate ? new Date(candidate.birthDate) : undefined,
  )
  const [selectedAvatar, setSelectedAvatar] = React.useState<File | null>(null)

  // Novos estados para Atuação do Cargo
  const [selectedPosition, setSelectedPosition] = React.useState<string>('')
  const [locationIds, setLocationIds] = React.useState<{
    stateId?: string
    municipalityId?: string
  }>({})
  const [intent, setIntent] = React.useState<'save' | 'create' | 'inactivate'>('save')

  const handleLocationChange = React.useCallback(
    (values: { stateId?: string; municipalityId?: string }) => {
      setLocationIds(values)
    },
    [],
  )

  const [state, formAction, isPending] = useActionState(organizationProfileAction, initialState)

  // Ordenar campanhas: ativas primeiro, depois mais recentes
  const campaigns = [...apiCampaigns].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    return b.electionYear - a.electionYear
  })
  const currentCampaign = campaigns[campaignPage]
  const totalPages = campaigns.length

  const canEditCampaign = canUpdate && currentCampaign?.isActive

  // Sincronizar estados locais ao mudar de campanha (paginação) ou modo de criação
  const [prevCampaignId, setPrevCampaignId] = React.useState(currentCampaign?.id)
  const [prevShowCreateForm, setPrevShowCreateForm] = React.useState(showCreateForm)

  if (currentCampaign?.id !== prevCampaignId || showCreateForm !== prevShowCreateForm) {
    setPrevCampaignId(currentCampaign?.id)
    setPrevShowCreateForm(showCreateForm)
    setIntent(showCreateForm ? 'create' : 'save')

    if (currentCampaign && !showCreateForm) {
      setSelectedPosition('')
      setLocationIds({})
      setSpendingRaw(Math.round(currentCampaign.legalSpendingLimit * 100).toString())
    } else if (showCreateForm) {
      setSelectedPosition('')
      setLocationIds({})
      setSpendingRaw('')
    }
  }
  const formMode = showCreateForm ? 'create' : canUpdate ? 'edit' : 'view'

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message)
        if (showCreateForm) {
          Promise.resolve().then(() => {
            setShowCreateForm(false)
            setSpendingRaw('')
          })
        }
      } else {
        toast.error(state.message)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  const handleDiscard = () => {
    setResetKey(k => k + 1)
    setShowCreateForm(false)
    setSpendingRaw('')
    setCampaignPage(0)
    router.refresh()
    toast.info('Alterações descartadas.')
  }

  // Intercept submit to ensure avatar and any latest state is in FormData
  const handleSubmit = (formData: FormData) => {
    // Garantir que o intent atual está no formData
    formData.set('intent', intent)

    if (selectedAvatar) {
      formData.set('avatar', selectedAvatar)
    }
    formAction(formData)
  }

  return (
    <form
      ref={formRef}
      key={resetKey}
      action={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-24"
    >
      {/* Hidden intent field */}
      <input type="hidden" name="intent" value={intent} readOnly />

      {/* ── Card 1: Candidato ─────────────────────────────────────────────── */}
      <Card className="h-full">
        <CardHeader className="py-4">
          <CardTitle className="text-base">Dados do Candidato</CardTitle>
          <CardDescription>Informações do candidato vinculado à organização.</CardDescription>
        </CardHeader>

        <CardContent className="pb-6">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel>Foto do Candidato</FieldLabel>
              <InputUploadInline
                name="avatar"
                defaultValue={candidate?.avatarUrl}
                disabled={!canUpdate || isPending}
                onFileChange={setSelectedAvatar}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="candidate_name">Nome Completo</FieldLabel>
                <Input
                  id="candidate_name"
                  name="name"
                  defaultValue={candidate?.name}
                  placeholder="ex: João da Silva"
                  disabled={!canUpdate || isPending}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ballot_name">Nome de Urna</FieldLabel>
                <Input
                  id="ballot_name"
                  name="ballot_name"
                  defaultValue={candidate?.ballotName}
                  placeholder="ex: João do Povo"
                  disabled={!canUpdate || isPending}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <Input
                  id="cpf"
                  name="cpf"
                  value={cpfValue}
                  onChange={e => setCpfValue(maskCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  disabled={!canUpdate || isPending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="social_name">Nome Social (opcional)</FieldLabel>
                <Input
                  id="social_name"
                  name="social_name"
                  defaultValue={candidate?.socialName}
                  placeholder="ex: Jô da Silva"
                  disabled={!canUpdate || isPending}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Data de Nascimento</FieldLabel>
              <DatePicker
                date={birthDate}
                setDate={setBirthDate}
                disabled={!canUpdate || isPending}
              />
              <input type="hidden" name="birth_date" value={birthDate?.toISOString() || ''} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* ── Card 2: Campanhas ─────────────────────────────────────────────── */}
      <Card className="h-full">
        <CardHeader className="py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">
                  {showCreateForm ? 'Nova Campanha' : 'Campanha Eleitoral'}
                </CardTitle>
                {!showCreateForm && currentCampaign && (
                  <Badge variant={currentCampaign.isActive ? 'default' : 'secondary'}>
                    {currentCampaign.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {showCreateForm
                  ? 'Preencha os dados para criar a nova campanha.'
                  : 'Gerencie as campanhas eleitorais desta organização.'}
              </CardDescription>
            </div>
            {showCreateForm && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground"
                onClick={() => {
                  setShowCreateForm(false)
                  setResetKey(prev => prev + 1)
                }}
                disabled={isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          {showCreateForm ? (
            /* ── Campos de criação ── */
            <FieldGroup className="gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="create_number">Nº Candidato</FieldLabel>
                  <Input
                    id="create_number"
                    name="candidate_number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="ex: 4567"
                    onChange={e => {
                      e.target.value = e.target.value.replace(/\D/g, '')
                    }}
                    disabled={isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="create_year">Ano</FieldLabel>
                  <Input
                    id="create_year"
                    name="election_year"
                    type="number"
                    min={new Date().getFullYear()}
                    placeholder="ex: 2028"
                    disabled={isPending}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="create_party">Partido</FieldLabel>
                <PartySelector
                  name="party_id"
                  parties={data.metadata.parties}
                  disabled={isPending}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="create_position">Cargo</FieldLabel>
                  <Select
                    name="position_id"
                    disabled={isPending}
                    onValueChange={v => {
                      setSelectedPosition(v)
                    }}
                  >
                    <SelectTrigger id="create_position">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.metadata.positions.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>Atuação do Cargo</FieldLabel>
                  <LocationSelector
                    positionId={selectedPosition}
                    onChange={handleLocationChange}
                    disabled={isPending}
                    states={data.metadata.states}
                    positions={data.metadata.positions}
                  />
                  <input type="hidden" name="state_id" value={locationIds.stateId || ''} />
                  <input
                    type="hidden"
                    name="municipality_id"
                    value={locationIds.municipalityId || ''}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="create_spending">Limite Legal de Gastos</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="create_spending"
                    placeholder="0,00"
                    value={
                      spendingRaw
                        ? new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(spendingRaw) / 100)
                        : ''
                    }
                    onChange={e => setSpendingRaw(e.target.value.replace(/\D/g, ''))}
                    disabled={isPending}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <input type="hidden" name="legal_spending_limit" value={spendingRaw} />
              </Field>
            </FieldGroup>
          ) : currentCampaign ? (
            /* ── Edição da campanha atual ── */
            <FieldGroup key={currentCampaign.id} className="gap-3">
              <input type="hidden" name="campaign_id" value={currentCampaign.id} />

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor={`number_${currentCampaign.id}`}>Nº Candidato</FieldLabel>
                  <Input
                    id={`number_${currentCampaign.id}`}
                    name="candidate_number"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    defaultValue={currentCampaign.candidateNumber}
                    onChange={e => {
                      e.target.value = e.target.value.replace(/\D/g, '')
                    }}
                    disabled={!canEditCampaign || isPending}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`year_${currentCampaign.id}`}>Ano</FieldLabel>
                  <Input
                    id={`year_${currentCampaign.id}`}
                    name="election_year"
                    type="number"
                    min={new Date().getFullYear()}
                    defaultValue={currentCampaign.electionYear}
                    disabled={!canEditCampaign || isPending}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor={`party_${currentCampaign.id}`}>Partido</FieldLabel>
                <PartySelector
                  name="party_id"
                  defaultValue={currentCampaign.partyId.toString()}
                  parties={data.metadata.parties}
                  disabled={!canEditCampaign || isPending}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor={`position_${currentCampaign.id}`}>Cargo</FieldLabel>
                  <Select
                    name="position_id"
                    defaultValue={currentCampaign.positionId.toString()}
                    disabled={!canEditCampaign || isPending}
                    onValueChange={v => {
                      setSelectedPosition(v)
                    }}
                  >
                    <SelectTrigger id={`position_${currentCampaign.id}`}>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.metadata.positions.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Atuação do Cargo</FieldLabel>
                  <LocationSelector
                    positionId={(selectedPosition || currentCampaign.positionId).toString()}
                    defaultValue={
                      currentCampaign.municipalityName
                        ? `${currentCampaign.municipalityName} - ${data.metadata.states.find(s => s.id === currentCampaign.stateId)?.acronym || currentCampaign.stateName}`
                        : data.metadata.states.find(s => s.id === currentCampaign.stateId)?.name ||
                          currentCampaign.stateName ||
                          undefined
                    }
                    defaultStateId={currentCampaign.stateId || undefined}
                    defaultMunicipalityId={currentCampaign.municipalityId || undefined}
                    onChange={handleLocationChange}
                    disabled={!canEditCampaign || isPending}
                    states={data.metadata.states}
                    positions={data.metadata.positions}
                  />
                  <input
                    type="hidden"
                    name="state_id"
                    value={locationIds.stateId ?? currentCampaign.stateId?.toString() ?? ''}
                  />
                  <input
                    type="hidden"
                    name="municipality_id"
                    value={
                      locationIds.municipalityId ?? currentCampaign.municipalityId?.toString() ?? ''
                    }
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor={`spending_${currentCampaign.id}`}>
                  Limite Legal de Gastos
                </FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id={`spending_${currentCampaign.id}`}
                    type="text"
                    inputMode="numeric"
                    value={
                      spendingRaw
                        ? new Intl.NumberFormat('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(spendingRaw) / 100)
                        : ''
                    }
                    onChange={e => setSpendingRaw(e.target.value.replace(/\D/g, ''))}
                    disabled={!canEditCampaign || isPending}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
                <input type="hidden" name="legal_spending_limit" value={spendingRaw} />
              </Field>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">
                    Campanha {campaignPage + 1} de {totalPages}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCampaignPage(p => Math.max(0, p - 1))}
                      disabled={campaignPage === 0 || isPending}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Anterior</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => setCampaignPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={campaignPage === totalPages - 1 || isPending}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Próxima</span>
                    </Button>
                  </div>
                </div>
              )}
            </FieldGroup>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-2">
              <p className="text-sm">Nenhuma campanha cadastrada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── FormButtons fixo no rodapé ─────────────────────────────────────── */}
      <FormButtons
        isPending={isPending}
        mode={formMode}
        onDiscard={handleDiscard}
        backUrl={`/${domain}/dashboard`}
        submitLabel={showCreateForm ? 'Criar Campanha' : 'Salvar Alterações'}
        extraActions={
          <>
            {canUpdate && !showCreateForm && currentCampaign?.isActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Encerrar Campanha
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Encerrar Campanha Atual?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao encerrar esta campanha, ela será <strong>inativada</strong>. Todos os dados
                      ligados a ela serão <strong>congelados</strong> e não poderão mais ser
                      editados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => {
                        setIntent('inactivate')
                        setTimeout(() => formRef.current?.requestSubmit(), 0)
                      }}
                    >
                      Encerrar Permanentemente
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {canCreate && !showCreateForm && (
              <AlertDialog open={showNewCampaignDialog} onOpenChange={setShowNewCampaignDialog}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const hasActive = campaigns.some(c => c.isActive)
                    if (hasActive) {
                      setShowNewCampaignDialog(true)
                    } else {
                      setShowCreateForm(true)
                      setSpendingRaw('')
                    }
                  }}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Campanha
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Criar Nova Campanha?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ao criar uma nova campanha, a campanha ativa atualmente será{' '}
                      <strong>inativada</strong>. Todos os dados ligados a ela serão{' '}
                      <strong>congelados</strong> e não poderão mais ser editados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setShowCreateForm(true)
                        setSpendingRaw('')
                      }}
                    >
                      Confirmar e Criar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {showCreateForm && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false)
                  setSpendingRaw('')
                }}
                disabled={isPending}
              >
                Cancelar criação
              </Button>
            )}
          </>
        }
      />
    </form>
  )
}
