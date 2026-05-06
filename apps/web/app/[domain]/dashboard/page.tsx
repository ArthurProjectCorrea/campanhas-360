import { signOutAction } from '@/lib/action/sign-out-action'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/page-header'

export default async function DashboardPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params

  return (
    <>
      <PageHeader
        title="Dashboard Executivo"
        description="Acompanhe o desempenho da sua campanha em tempo real."
        breadcrumbs={[{ label: 'Dashboard' }]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Dashboard - {domain}</CardTitle>
            <CardDescription>
              Bem-vindo à área restrita da <strong>{domain}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Aqui você pode gerenciar suas campanhas e visualizar métricas de performance.
            </p>
            <form action={signOutAction}>
              <Button type="submit" variant="destructive" className="w-full">
                Sair da conta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
