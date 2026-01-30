import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  change?: number
  changeType?: 'percent' | 'currency'
  icon?: React.ReactNode
  variant?: 'default' | 'highlight'
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'currency',
  icon,
  variant = 'default',
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === undefined || change === 0
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  
  return (
    <Card variant="elevated" className={cn(
      variant === 'highlight' && 'ring-2 ring-primary dark:ring-dark-accent'
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">
              {title}
            </p>
            <p className={cn(
              'text-2xl font-bold',
              'text-text-primary dark:text-dark-text-primary'
            )}>
              {formatCurrency(value)}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    isPositive ? 'success' : isNegative ? 'warning' : 'neutral'
                  }
                  className="flex items-center gap-1"
                >
                  <TrendIcon className="h-3 w-3" />
                  {changeType === 'percent'
                    ? formatPercent(change)
                    : formatCurrency(Math.abs(change))}
                </Badge>
                <span className="text-xs text-text-secondary dark:text-dark-text-secondary">
                  vs. período anterior
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="text-primary dark:text-dark-accent">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
