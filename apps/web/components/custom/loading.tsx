import { Spinner } from '@/components/ui/spinner'

export function LoadingComponent() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/20" />
        <Spinner className="h-10 w-10 text-primary" />
      </div>
      {/* <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium animate-pulse">Carregando dados...</p>
        <p className="text-xs text-muted-foreground">Por favor, aguarde um momento.</p>
      </div> */}
    </div>
  )
}
