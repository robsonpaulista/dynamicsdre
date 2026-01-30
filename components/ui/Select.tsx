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
}

export function Select({ 
  className, 
  children, 
  options, 
  onValueChange,
  onChange,
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

  return (
    <div className="relative">
      <select
        className={cn(
          'appearance-none w-full rounded-lg border border-border dark:border-dark-border',
          'bg-background dark:bg-dark-card',
          'px-4 py-2 pr-10',
          'text-text-primary dark:text-dark-text-primary',
          '[&>option]:text-text-primary [&>option]:dark:text-dark-text-primary',
          '[&>option]:bg-background [&>option]:dark:bg-dark-card',
          'focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-accent',
          'transition-colors duration-200',
          className
        )}
        onChange={handleChange}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option key={option.value} value={option.value} className="text-text-primary dark:text-dark-text-primary">
              {option.label}
            </option>
          ))
        ) : (
          children
        )}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-dark-text-secondary pointer-events-none" />
    </div>
  )
}
