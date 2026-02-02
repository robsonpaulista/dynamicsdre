import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  children?: React.ReactNode
  options?: SelectOption[]
  onValueChange?: (value: string) => void
  /** 'light' = texto e borda claros (ex.: navbar com gradiente escuro) */
  variant?: 'default' | 'light'
}

export function Select({ 
  className, 
  children, 
  options, 
  onValueChange,
  onChange,
  variant = 'default',
  ...props 
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value)
    }
    if (onChange) {
      onChange(e)
    }
  }

  const isLight = variant === 'light'
  return (
    <div className="relative">
      <select
        className={cn(
          'appearance-none w-full rounded-lg border px-4 py-2 pr-10 transition-colors duration-200',
          'focus:outline-none focus:ring-2 accent-primary',
          isLight
            ? 'border-white/25 bg-white/15 text-white focus:ring-white/30 [&>option]:text-text-primary [&>option]:bg-background'
            : cn(
                'border-border dark:border-dark-border',
                'bg-background dark:bg-dark-card',
                'text-text-primary dark:text-dark-text-primary',
                '[&>option]:text-text-primary [&>option]:dark:text-dark-text-primary',
                '[&>option]:bg-background [&>option]:dark:bg-dark-card',
                'focus:ring-primary dark:focus:ring-dark-accent focus:border-primary dark:focus:border-dark-primary'
              ),
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value} className={isLight ? 'text-text-primary bg-background' : 'text-text-primary dark:text-dark-text-primary'}>
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      <ChevronDown className={cn('absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none', isLight ? 'text-white/90' : 'text-primary dark:text-dark-primary')} />
    </div>
  )
}
