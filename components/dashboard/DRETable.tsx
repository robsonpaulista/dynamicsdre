'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { DRERow } from './DRERow'
import type { DRERowData, VariationHighlight } from '@/types/dre'

interface DRETableProps {
  items: DRERowData[]
  sheets: string[]
  variationHighlights?: VariationHighlight[] | null
}

function formatMonthName(month: string): string {
  // Formatar mês de YYYY-MM para "MMM/YYYY" (ex: "2025-01" -> "Jan/2025")
  try {
    const [year, monthNum] = month.split('-')
    const monthNames = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]
    const monthIndex = parseInt(monthNum, 10) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]}/${year}`
    }
    return month
  } catch {
    return month
  }
}

export function DRETable({ items, sheets, variationHighlights }: DRETableProps) {
  if (items.length === 0 || sheets.length === 0) {
    return (
      <Card variant="elevated">
        <CardContent className="p-12 text-center">
          <p className="text-text-secondary dark:text-dark-text-secondary">
            Nenhum dado encontrado.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  // Calcular receita operacional líquida por mês (COD 5) para % no tooltip
  const receitaPorMes = new Map<string, number>()
  sheets.forEach(month => {
    const receitaLiquida = items
      .filter(item => item.codPlanoconta === '5')
      .reduce((sum, item) => sum + (item.valuesBySheet[month] || 0), 0)
    receitaPorMes.set(month, receitaLiquida)
  })
  
  return (
    <Card variant="elevated" className="overflow-hidden w-full flex-1 min-h-0 flex flex-col">
      <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
        {/* Container com rolagem própria: usa todo o espaço vertical disponível */}
        <div className="overflow-auto w-full flex-1 min-h-0">
          <table className="w-full" style={{ tableLayout: 'auto' }}>
            <thead className="bg-background-soft dark:bg-dark-primary-surface border-b border-border dark:border-dark-border sticky top-0 z-20">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary dark:text-dark-text-primary sticky left-0 z-30 w-[250px] bg-background-soft dark:bg-dark-primary-surface shadow-[4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[4px_0_6px_-2px_rgba(0,0,0,0.25)]">
                  Plano de Contas
                </th>
                {/* Colunas dinâmicas para cada mês */}
                {sheets.map((month) => (
                  <th key={month} className="px-4 py-3 text-right text-sm font-semibold text-text-primary dark:text-dark-text-primary whitespace-nowrap">
                    {formatMonthName(month)}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary dark:text-dark-text-primary whitespace-nowrap">
                  Acumulado
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                // Determinar tipo para cores
                const cod = item.codPlanoconta.toLowerCase()
                const plano = item.plano.toLowerCase()
                let itemType: 'revenue' | 'cost' | 'expense' | 'result' | undefined
                
                if (cod.startsWith('1') || plano.includes('receita')) {
                  itemType = 'revenue'
                } else if (cod.startsWith('6') || plano.includes('custo') || plano.includes('cmv')) {
                  itemType = 'cost'
                } else if (cod.startsWith('8') || cod.startsWith('12') || plano.includes('despesa') || plano.includes('participação')) {
                  itemType = 'expense'
                } else if (cod.startsWith('7') || cod.startsWith('9') || cod.startsWith('11') || cod.startsWith('13') || plano.includes('resultado') || plano.includes('lucro') || plano.includes('saldo')) {
                  itemType = 'result'
                }
                
                const getTypeStyles = () => {
                  // Participações (COD 12) sempre usa cor padrão, não é totalizador
                  if (item.codPlanoconta === '12') {
                    return 'text-text-primary dark:text-dark-text-primary'
                  }
                  
                  // Saldo (COD 11) e Resultado Líquido (COD 13): cor do tema (primary)
                  if (item.codPlanoconta === '11' || item.codPlanoconta === '13') {
                    return 'text-primary dark:text-dark-primary'
                  }
                  
                  switch (itemType) {
                    case 'revenue':
                      return 'text-success dark:text-dark-success'
                    case 'cost':
                    case 'expense':
                      return 'text-text-secondary dark:text-dark-text-secondary'
                    case 'result':
                      return 'text-primary dark:text-dark-accent'
                    default:
                      return 'text-text-primary dark:text-dark-text-primary'
                  }
                }
                
                const getValueStyles = (value: number) => {
                  // Participações (COD 12) sempre usa cor padrão, não é totalizador
                  if (item.codPlanoconta === '12') {
                    return 'text-text-primary dark:text-dark-text-primary'
                  }
                  
                  // Saldo (COD 11) e Resultado Líquido (COD 13): vermelho se negativo, cor do tema se positivo
                  if (item.codPlanoconta === '11' || item.codPlanoconta === '13') {
                    return value >= 0 
                      ? 'text-primary dark:text-dark-primary' 
                      : 'text-danger dark:text-dark-danger'
                  }
                  
                  // Verde apenas para outros totalizadores (result) com valores positivos
                  if (itemType === 'result') {
                    return value >= 0 
                      ? 'text-success dark:text-dark-success' 
                      : 'text-danger dark:text-dark-danger'
                  }
                  return getTypeStyles()
                }
                
                const hasHighlights = (variationHighlights?.length ?? 0) > 0
                return (
                  <DRERow
                    key={item.codPlanoconta || index}
                    item={item}
                    sheets={sheets}
                    receitaPorMes={receitaPorMes}
                    level={0}
                    index={index}
                    getTypeStyles={getTypeStyles}
                    getValueStyles={getValueStyles}
                    variationHighlights={variationHighlights ?? undefined}
                    initialExpanded={hasHighlights && (item.codPlanoconta === '8' || item.codPlanoconta.startsWith('8.'))}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
