import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-border dark:bg-dark-border',
        className
      )}
      {...props}
    />
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-card bg-background dark:bg-dark-card border border-border dark:border-dark-border p-6">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-6 w-20" />
    </div>
  )
}

export function DREItemSkeleton() {
  return (
    <div className="rounded-card bg-background dark:bg-dark-card border border-border dark:border-dark-border p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
  )
}
