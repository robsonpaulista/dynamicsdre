'use client'

import React from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DREAnalyst } from '@/components/dashboard/DREAnalyst'
import { Moon, Sun, Search } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import type { DRERowData, VariationHighlight } from '@/types/dre'

interface HeaderProps {
  companyName?: string
  year?: number
  onYearChange?: (year: number) => void
  expenseSearch?: string
  onExpenseSearchChange?: (value: string) => void
  dreData?: DRERowData[]
  sheets?: string[]
  tableWrapperRef?: React.RefObject<HTMLDivElement | null>
  onHighlights?: (highlights: VariationHighlight[] | null) => void
}

export function Header({ 
  companyName = 'Empresa',
  year = 2025,
  onYearChange,
  expenseSearch = '',
  onExpenseSearchChange,
  dreData,
  sheets,
  tableWrapperRef,
  onHighlights,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const inputVariantLight = theme === 'dark'
  
  // Anos disponíveis: 2025 a 2030
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i).map(y => ({
    value: y.toString(),
    label: y.toString(),
  }))
  
  const handleYearChange = (value: string) => {
    if (onYearChange) {
      onYearChange(parseInt(value, 10))
    }
  }
  
  return (
    <header className="navbar-gradient sticky top-0 z-50 w-full border-border dark:border-white/10 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-text-primary dark:text-white">
              {companyName}
            </h1>
            <p className="text-xs text-text-secondary dark:text-white/70 mt-0.5">
              Desenvolvido por 86Dynamics
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-primary dark:text-white/85 whitespace-nowrap">
              Ano:
            </span>
            <Select
              value={year.toString()}
              onValueChange={handleYearChange}
              options={years}
              placeholder="Selecione o ano"
              variant={theme === 'dark' ? 'light' : 'default'}
              className="min-w-[120px]"
            />
            {dreData != null && dreData.some((r) => r.codPlanoconta === '8') && onExpenseSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary dark:text-white/60 pointer-events-none" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => onExpenseSearchChange(e.target.value)}
                  placeholder="Buscar nas despesas..."
                  className={cn(
                    'w-44 rounded-lg border pl-9 pr-3 py-2 text-sm transition-colors',
                    'placeholder:text-text-secondary dark:placeholder:text-white/50',
                    'focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary',
                    inputVariantLight
                      ? 'border-white/25 bg-white/15 text-white'
                      : 'border-border dark:border-dark-border bg-background dark:bg-dark-card text-text-primary dark:text-dark-text-primary'
                  )}
                />
              </div>
            )}
            {dreData != null && sheets != null && dreData.length > 0 && (
              <DREAnalyst
                dreData={dreData}
                sheets={sheets}
                year={year ?? 2025}
                expenseFilter={expenseSearch?.trim() || undefined}
                tableWrapperRef={tableWrapperRef}
                onHighlights={onHighlights}
                variant="icon"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="rounded-full p-1 hover:bg-primary/10 dark:hover:bg-white/15"
            >
              <span className="flex items-center justify-center rounded-full p-1.5 bg-primary dark:bg-transparent">
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-white" />
                ) : (
                  <Sun className="h-5 w-5 text-white" />
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
