'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DREItemData } from '@/types/dre'

interface DREItemProps {
  item: DREItemData
  level?: number
  totalRevenue: number
}

export function DREItem({ item, level = 0, totalRevenue }: DREItemProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = item.children && item.children.length > 0
  const percent = item.percent ?? (totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0)
  
  const getTypeStyles = () => {
    switch (item.type) {
      case 'revenue':
        return 'text-success dark:text-dark-success'
      case 'cost':
      case 'expense':
        return 'text-text-secondary dark:text-dark-text-secondary'
      case 'result':
        return 'text-primary dark:text-dark-accent font-bold'
      default:
        return 'text-text-primary dark:text-dark-text-primary'
    }
  }
  
  return (
    <div>
      <Card
        variant="elevated"
        className={cn(
          'transition-all duration-200',
          level > 0 && 'ml-4 sm:ml-6',
          level === 0 && 'mb-2'
        )}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {hasChildren && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 p-1 hover:bg-background-soft dark:hover:bg-dark-primary-surface rounded transition-colors"
                  aria-label={isExpanded ? 'Recolher' : 'Expandir'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
                  )}
                </button>
              )}
              <span
                className={cn(
                  'text-sm sm:text-base font-medium truncate',
                  level === 0 && 'font-semibold',
                  getTypeStyles()
                )}
                style={{ paddingLeft: hasChildren ? 0 : level * 20 }}
              >
                {item.label}
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className={cn('text-sm sm:text-base font-semibold', getTypeStyles())}>
                  {formatCurrency(item.value)}
                </p>
                {item.type !== 'result' && (
                  <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                    {formatPercent(percent)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {hasChildren && isExpanded && (
        <div className="mt-2">
          {item.children!.map((child) => (
            <DREItem
              key={child.id}
              item={child}
              level={level + 1}
              totalRevenue={totalRevenue}
            />
          ))}
        </div>
      )}
    </div>
  )
}
