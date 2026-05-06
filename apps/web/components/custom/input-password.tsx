'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

const InputPassword = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof InputGroupInput>
>(({ className, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  return (
    <InputGroup className={cn('group/password', className)}>
      <InputGroupInput
        placeholder="••••••••"
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        autoComplete="new-password"
        className={cn(
          '[&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        )}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
})
InputPassword.displayName = 'InputPassword'

export { InputPassword }
