'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface FormButtonsProps {
  isPending: boolean
  mode: 'create' | 'edit' | 'view'
  onDiscard: () => void
  backUrl: string
  className?: string
}

export function FormButtons({ isPending, mode, onDiscard, backUrl, className }: FormButtonsProps) {
  const router = useRouter()
  const { state, isMobile } = useSidebar()

  // Define offsets based on sidebar constants
  // SIDEBAR_WIDTH = 16rem (256px)
  // SIDEBAR_WIDTH_ICON = 3rem (48px)
  const leftOffset = isMobile ? '0' : state === 'expanded' ? '256px' : '48px'

  return (
    <div
      className={cn(
        'fixed bottom-0 right-0 z-50 flex items-center justify-between border-t bg-background/80 px-6 py-4 backdrop-blur-md transition-[left] duration-200 ease-linear',
        className,
      )}
      style={{ left: leftOffset }}
    >
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(backUrl)}
          disabled={isPending}
        >
          Voltar
        </Button>
      </div>

      <div className="flex gap-3">
        {mode !== 'view' && (
          <>
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={isPending}>
              Descartar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Salvando...
                </>
              ) : mode === 'create' ? (
                'Criar Registro'
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
