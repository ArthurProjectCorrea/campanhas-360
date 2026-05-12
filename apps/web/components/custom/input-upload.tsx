'use client'

import * as React from 'react'
import { CloudUpload, X, FileIcon } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface InputUploadProps {
  name: string
  label?: string
  description?: string
  accept?: string
  maxSize?: number // in MB
  defaultValue?: string
  className?: string
  onFileChange?: (file: File | null) => void
  disabled?: boolean
}

export function InputUpload({
  name,
  label,
  description,
  accept = 'image/*',
  maxSize = 2,
  defaultValue,
  className,
  onFileChange,
  disabled,
}: InputUploadProps) {
  const normalizedDefaultValue = defaultValue?.startsWith('/')
    ? `${API_URL}${defaultValue}`
    : defaultValue
  const [preview, setPreview] = React.useState<string | null>(normalizedDefaultValue || null)
  const [file, setFile] = React.useState<File | null>(null)
  const [isLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      toast.error(`O arquivo é muito grande. O limite é ${maxSize}MB.`)
      return
    }

    // Validate type (basic)
    if (accept.includes('image') && !selectedFile.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.')
      return
    }

    setFile(selectedFile)

    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }

    onFileChange?.(selectedFile)
  }

  const handleClear = () => {
    setFile(null)
    setPreview(null)
    onFileChange?.(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative group">
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
        />

        {preview || file ? (
          <div className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-3 bg-muted/30">
            {preview ? (
              <div className="w-full overflow-hidden rounded-lg border bg-background">
                <Image
                  src={preview}
                  alt="Preview"
                  width={300}
                  height={200}
                  className="w-full h-auto object-contain max-h-[200px]"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-lg bg-muted border border-dashed">
                <FileIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-medium truncate max-w-[250px]">
                {file ? file.name : 'Foto atual'}
              </p>
              {file && (
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              )}
            </div>
            {!disabled && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading && <Spinner className="mr-2" />}
                  Alterar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleClear}
                  disabled={isLoading}
                >
                  {isLoading ? <Spinner className="mr-2" /> : <X className="h-4 w-4 mr-1" />}
                  Remover
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Empty
            className="border border-dashed cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => !isLoading && !disabled && inputRef.current?.click()}
          >
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CloudUpload />
              </EmptyMedia>
              <EmptyTitle>{label || 'Upload de Foto'}</EmptyTitle>
              <EmptyDescription>
                {description || `Clique para fazer upload (Máx. ${maxSize}MB)`}
              </EmptyDescription>
            </EmptyHeader>
            {!disabled && (
              <EmptyContent>
                <Button variant="outline" type="button" disabled={isLoading}>
                  {isLoading && <Spinner className="mr-2" />}
                  Selecionar Arquivo
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </div>
  )
}

// ─── Variante compacta (tamanho de input de texto) ───────────────────────────

interface InputUploadInlineProps {
  name: string
  defaultValue?: string
  disabled?: boolean
  onFileChange?: (file: File | null) => void
}

export function InputUploadInline({
  name,
  defaultValue,
  disabled,
  onFileChange,
}: InputUploadInlineProps) {
  const normalizedDefaultValue = defaultValue?.startsWith('/')
    ? `${API_URL}${defaultValue}`
    : defaultValue
  const [preview, setPreview] = React.useState<string | null>(normalizedDefaultValue || null)
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [isLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('O arquivo é muito grande. O limite é 2MB.')
      return
    }
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.')
      return
    }

    setFileName(selectedFile.name)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(selectedFile)

    onFileChange?.(selectedFile)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
    onFileChange?.(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClick = () => {
    if (!disabled && !isLoading) inputRef.current?.click()
  }

  return (
    <div
      role={!disabled ? 'button' : undefined}
      tabIndex={!disabled ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      className={cn(
        // Mesmo visual do <Input> do shadcn/ui
        'flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background',
        'transition-colors',
        !disabled &&
          !isLoading &&
          'cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isLoading}
      />

      {/* Thumbnail */}
      <div className="relative h-6 w-6 shrink-0 rounded-full border bg-muted overflow-hidden">
        {preview ? (
          <Image src={preview} alt="Avatar" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CloudUpload className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Label / filename */}
      <span className={cn('flex-1 truncate', !preview && !fileName && 'text-muted-foreground')}>
        {isLoading
          ? 'Enviando...'
          : fileName
            ? fileName
            : preview
              ? 'Foto definida'
              : 'Selecionar foto...'}
      </span>

      {/* Spinner ou ícone de limpar */}
      {isLoading ? (
        <Spinner className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : preview && !disabled ? (
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remover foto"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
