import Image from 'next/image'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

interface Breadcrumb {
  label: string
  href?: string
}

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs: Breadcrumb[]
}

export function PageHeader({ title, description, breadcrumbs }: PageHeaderProps) {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex flex-1 items-center justify-between gap-2 border-b py-2">
          <div className="flex items-center gap-2 ">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Campanhas 360</BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      {crumb.href ? (
                        <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center">
            <Image
              src="/campanha-logo-light.svg"
              alt="Logo"
              width={150}
              height={50}
              priority
              className="h-10 w-auto dark:hidden"
            />
            <Image
              src="/campanha-logo-dark.svg"
              alt="Logo"
              width={150}
              height={50}
              priority
              className="hidden h-10 w-auto dark:block"
            />
          </div>
        </div>
      </header>
      <div className="flex flex-col gap-1 px-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
    </>
  )
}
