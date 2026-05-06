import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ModeToggle } from '@/components/mode-toggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/campanha-logo-light.svg"
              alt="Logo"
              width={150}
              height={50}
              priority
              className="h-12 w-auto dark:hidden"
            />
            <Image
              src="/campanha-logo-dark.svg"
              alt="Logo"
              width={150}
              height={50}
              priority
              className="hidden h-12 w-auto dark:block"
            />
          </Link>
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-primary lg:block">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--primary-foreground)_1px,transparent_1px)] opacity-10 [background-size:20px_20px]" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md space-y-6 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Potencialize suas Campanhas</h2>
            <p className="text-lg opacity-80">
              A ferramenta definitiva para gestão 360 de marketing e performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
