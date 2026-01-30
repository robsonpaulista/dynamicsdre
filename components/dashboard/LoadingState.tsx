import React from 'react'
import { MetricCardSkeleton, DREItemSkeleton } from '@/components/ui/Skeleton'

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-card bg-background dark:bg-dark-card border border-border dark:border-dark-border p-6">
          <div className="h-[300px] animate-pulse bg-border dark:bg-dark-border rounded" />
        </div>
        <div className="rounded-card bg-background dark:bg-dark-card border border-border dark:border-dark-border p-6">
          <div className="h-[300px] animate-pulse bg-border dark:bg-dark-border rounded" />
        </div>
      </div>
      
      <div className="space-y-2">
        <DREItemSkeleton />
        <DREItemSkeleton />
        <DREItemSkeleton />
        <DREItemSkeleton />
      </div>
    </div>
  )
}
