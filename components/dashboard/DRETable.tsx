'use client'

import React, { useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { DRERow } from './DRERow'
import type { DRERowData, VariationHighlight } from '@/types/dre'

interface DRETableProps {
  items: DRERowData[]
  sheets: string[]
  /** Termo para buscar nas despesas (ex.: "aluguel" mostra grupos/contas que contenham o termo) */
  expenseSearch?: string
  variationHighlights?: VariationHighlight[] | null
  /** IDs dos itens excluídos */
  excludedItems?: string[]
  /** Função para excluir um item */
  onExcludeItem?: (itemId: string) => Promise<void>
  /** Função para restaurar um item excluído */
  onRestoreItem?: (itemId: string) => Promise<void>
  /** Função para verificar se um item está excluído */
  isItemExcluded?: (itemId: string) => boolean
  /** Função para mover um item para outro grupo */
  onMoveItem?: (codPlanoconta: string, fromGrupo: string, toGrupo: string) => Promise<void>
}

function filterItemsByExpenseSearch(items: DRERowData[], searchTerm: string): DRERowData[] {
  const term = searchTerm.trim().toLowerCase()
  if (!term) return items

  return items.map((item) => {
    if (item.codPlanoconta !== '8' || !item.children?.length) return item

    const filteredGrupos = item.children
      .map((grupo) => {
        const grupoMatch = grupo.plano.toLowerCase().includes(term)
        const contasMatch = grupo.children?.filter((c) => c.plano.toLowerCase().includes(term)) ?? []
        const hasMatchingContas = contasMatch.length > 0

        if (grupoMatch) {
          return { ...grupo, children: grupo.children }
        }
        if (hasMatchingContas) {
          return { ...grupo, children: contasMatch }
        }
        return null
      })
      .filter((g): g is DRERowData => g != null)

    return { ...item, children: filteredGrupos }
  })
}

function formatMonthName(month: string): string {
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

export function DRETable({ 
  items, 
  sheets, 
  expenseSearch = '', 
  variationHighlights,
  excludedItems = [],
  onExcludeItem,
  onRestoreItem,
  isItemExcluded,
  onMoveItem
}: DRETableProps) {
  const displayItems = filterItemsByExpenseSearch(items, expenseSearch)

  if (displayItems.length === 0 || sheets.length === 0) {
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
  
  // Extrair grupos de despesas (filhos diretos de COD 8) para o recurso de mover
  const despesasItem = items.find(i => i.codPlanoconta === '8')
  const despesaGrupos = despesasItem?.children?.map(g => ({
    codPlanoconta: g.codPlanoconta,
    plano: g.plano
  })) ?? []
  
  // Calcular receita operacional líquida por mês (COD 5) para % no tooltip
  const receitaPorMes = new Map<string, number>()
  sheets.forEach(month => {
    const receitaLiquida = displayItems
      .filter(item => item.codPlanoconta === '5')
      .reduce((sum, item) => sum + (item.valuesBySheet[month] || 0), 0)
    receitaPorMes.set(month, receitaLiquida)
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0)
  }, [sheets])
  
  const colPlano = 280
  const colMes = 120
  const tableMinWidth = colPlano + (sheets.length + 1) * colMes

  return (
    <div className="w-full flex-1 min-h-0 relative border border-border dark:border-dark-border rounded-card bg-background dark:bg-dark-card shadow-card-light dark:shadow-card-dark overflow-hidden">
      {/* Scroll com altura definida por absolute — cabeçalho e tabela rolam juntos */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Uma única tabela: thead sticky + tbody — colunas sempre alinhadas */}
        <table className="border-collapse w-full" style={{ tableLayout: 'fixed', minWidth: tableMinWidth }}>
          <colgroup>
            <col style={{ width: colPlano }} />
            {sheets.map((month) => (
              <col key={month} style={{ width: colMes }} />
            ))}
            <col style={{ width: colMes }} />
          </colgroup>
          <thead className="bg-primary border-b border-primary-hover">
            <tr>
              <th className="sticky top-0 z-10 bg-primary px-4 py-3 text-left text-sm font-semibold text-white whitespace-nowrap border-b border-primary-hover" style={{ width: colPlano }}>
                Plano de Contas
              </th>
              {sheets.map((month) => (
                <th key={month} className="sticky top-0 z-10 bg-primary px-4 py-3 text-right text-sm font-semibold text-white whitespace-nowrap border-b border-primary-hover" style={{ width: colMes }}>
                  {formatMonthName(month)}
                </th>
              ))}
              <th className="sticky top-0 z-10 bg-primary px-4 py-3 text-right text-sm font-semibold text-white whitespace-nowrap border-b border-primary-hover" style={{ width: colMes }}>
                Acumulado
              </th>
            </tr>
          </thead>
          <tbody>
              {displayItems.map((item, index) => {
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
                
                // Nomes dos planos de contas: sempre cor preta padrão
                const getTypeStyles = () =>
                  'text-text-primary dark:text-dark-text-primary'
                
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
                    expenseSearch={expenseSearch}
                    initialExpanded={(hasHighlights || !!expenseSearch.trim()) && (item.codPlanoconta === '8' || item.codPlanoconta.startsWith('8.'))}
                    excludedItems={excludedItems}
                    onExcludeItem={onExcludeItem}
                    onRestoreItem={onRestoreItem}
                    isItemExcluded={isItemExcluded}
                    despesaGrupos={despesaGrupos}
                    onMoveItem={onMoveItem}
                  />
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
