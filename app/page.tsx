'use client'

import React, { useState, useRef } from 'react'
import { Header } from '@/components/dashboard/Header'
import { DRETable } from '@/components/dashboard/DRETable'
import { LoadingState } from '@/components/dashboard/LoadingState'
import { useDREData } from '@/hooks/useDREData'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import type { VariationHighlight } from '@/types/dre'

export default function Home() {
  const [year, setYear] = useState(2025)
  const { data: dreData, sheets, loading, error } = useDREData(year)
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [variationHighlights, setVariationHighlights] = useState<VariationHighlight[] | null>(null)
  
  return (
    <div className="min-h-screen flex flex-col bg-background-soft dark:bg-dark-background w-full">
      <Header
        companyName="Minha Empresa"
        year={year}
        onYearChange={setYear}
        dreData={dreData}
        sheets={sheets}
        tableWrapperRef={tableWrapperRef}
        onHighlights={setVariationHighlights}
      />
      
      <main className="flex-1 flex flex-col min-h-0 w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <Card variant="elevated" className="mb-6 border-danger/20 bg-danger/5 shrink-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-danger" />
                <div>
                  <p className="font-semibold text-danger">Erro ao carregar dados</p>
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {loading ? (
          <LoadingState />
        ) : dreData.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="p-12 text-center">
              <p className="text-text-secondary dark:text-dark-text-secondary">
                Nenhum dado encontrado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div ref={tableWrapperRef} className="w-full flex-1 min-h-0 flex flex-col">
            <DRETable
              items={dreData}
              sheets={sheets}
              variationHighlights={variationHighlights}
            />
          </div>
        )}
      </main>
    </div>
  )
}
