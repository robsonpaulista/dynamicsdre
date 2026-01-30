'use client'

import React from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { DREAnalyst } from '@/components/dashboard/DREAnalyst'
import { Moon, Sun, Building2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import type { DRERowData, VariationHighlight } from '@/types/dre'

interface HeaderProps {
  companyName?: string
  year?: number
  onYearChange?: (year: number) => void
  dreData?: DRERowData[]
  sheets?: string[]
  tableWrapperRef?: React.RefObject<HTMLDivElement | null>
  onHighlights?: (highlights: VariationHighlight[] | null) => void
}

export function Header({ 
  companyName = 'Empresa',
  year = 2025,
  onYearChange,
  dreData,
  sheets,
  tableWrapperRef,
  onHighlights,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  
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
    <header className="sticky top-0 z-50 w-full border-b border-border dark:border-dark-border bg-background/95 dark:bg-dark-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:supports-[backdrop-filter]:bg-dark-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary dark:text-dark-accent" />
            <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">
              {companyName}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
              Ano:
            </span>
            <Select
              value={year.toString()}
              onValueChange={handleYearChange}
              options={years}
              placeholder="Selecione o ano"
              className="min-w-[120px]"
            />
            {dreData != null && sheets != null && dreData.length > 0 && (
              <DREAnalyst
                dreData={dreData}
                sheets={sheets}
                year={year ?? 2025}
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
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
