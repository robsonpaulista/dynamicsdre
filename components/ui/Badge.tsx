import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'danger' | 'neutral'
  children: React.ReactNode
}

export function Badge({ 
  className, 
  variant = 'neutral', 
  children, 
  ...props 
}: BadgeProps) {
  const variants = {
    success: 'bg-success/10 text-success dark:bg-dark-success/20 dark:text-dark-success',
    warning: 'bg-warning/10 text-warning dark:bg-dark-warning/20 dark:text-dark-warning',
    danger: 'bg-danger/10 text-danger dark:bg-dark-danger/20 dark:text-dark-danger',
    neutral: 'bg-text-secondary/10 text-text-secondary dark:bg-dark-text-secondary/20 dark:text-dark-text-secondary',
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
