'use client'

import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function Forbidden() {
  const params = useParams()
  const domain = params.domain as string

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">403 - Acesso Negado</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        Desculpe, você não tem permissão para acessar esta página. Entre em contato com o
        administrador se você acredita que isso é um erro.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <a href={`/${domain}/dashboard`}>Voltar para o Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
