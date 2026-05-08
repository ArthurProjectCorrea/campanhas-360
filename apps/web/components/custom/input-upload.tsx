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
import { uploadAvatarAction } from '@/lib/action/organization-profile-action'

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
  const [preview, setPreview] = React.useState<string | null>(defaultValue || null)
  const [file, setFile] = React.useState<File | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsLoading(true)
    setFile(selectedFile)

    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }

    // Upload imediato
    const formData = new FormData()
    formData.append('avatar', selectedFile)

    const result = await uploadAvatarAction(formData)

    if (result.success) {
      toast.success(result.message)
      onFileChange?.(selectedFile)
    } else {
      toast.error(result.message)
      setPreview(defaultValue || null)
      setFile(null)
    }

    setIsLoading(false)
  }

  const handleClear = async () => {
    setIsLoading(true)

    const formData = new FormData()
    formData.append('avatar_remove', 'true')

    const result = await uploadAvatarAction(formData)

    if (result.success) {
      toast.success(result.message)
      setFile(null)
      setPreview(null)
      onFileChange?.(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    } else {
      toast.error(result.message)
    }

    setIsLoading(false)
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
