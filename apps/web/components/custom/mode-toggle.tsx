'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'

interface ModeToggleProps {
  variant?: 'dropdown' | 'switch'
}

export function ModeToggle({ variant = 'dropdown' }: ModeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme()

  if (variant === 'switch') {
    const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

    return (
      <FieldGroup className="w-full">
        <FieldLabel htmlFor="dark-mode">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>Tema Visual</FieldTitle>
              <FieldDescription>
                {isDark ? 'Tema escuro ativado' : 'Tema claro ativado'}
              </FieldDescription>
            </FieldContent>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
            />
          </Field>
        </FieldLabel>
      </FieldGroup>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>Claro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>Escuro</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>Sistema</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
