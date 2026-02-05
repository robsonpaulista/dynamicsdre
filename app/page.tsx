'use client'

import React, { useState, useRef, useMemo } from 'react'
import { Header } from '@/components/dashboard/Header'
import { DRETable } from '@/components/dashboard/DRETable'
import { LoadingState } from '@/components/dashboard/LoadingState'
import { useDREData } from '@/hooks/useDREData'
import { useCustomizations } from '@/hooks/useCustomizations'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import type { VariationHighlight, DRERowData, AddedItem } from '@/types/dre'

/** Movimento de item */
interface MovedItem {
  codPlanoconta: string
  fromGrupo: string
  toGrupo: string
}

/** Aplica customizações (exclusões, movimentos e adições) nas linhas da DRE */
function applyCustomizations(
  items: DRERowData[], 
  excludedItems: string[], 
  movedItems: MovedItem[],
  addedItems: AddedItem[],
  sheets: string[]
): DRERowData[] {
  // Criar um mapa de movimentos por codPlanoconta
  const moveMap = new Map<string, MovedItem>()
  movedItems.forEach(m => moveMap.set(m.codPlanoconta, m))
  
  // Coletar itens movidos para adicionar ao destino depois
  const itemsToMove: { item: DRERowData; toGrupo: string }[] = []
  
  function processItem(item: DRERowData, parentPath: string = ''): DRERowData | null {
    const itemId = parentPath ? `${parentPath}.${item.plano}` : item.codPlanoconta
    
    // Se este item está excluído, retorna null
    if (excludedItems.includes(itemId)) {
      return null
    }
    
    // Se este item foi movido para outro grupo, guarda e remove do grupo atual
    const movement = moveMap.get(item.codPlanoconta)
    if (movement && parentPath === movement.fromGrupo) {
      itemsToMove.push({ item, toGrupo: movement.toGrupo })
      return null // Remove do grupo de origem
    }
    
    // Se tem filhos, processa recursivamente
    if (item.children && item.children.length > 0) {
      const newChildren = item.children
        .map(child => processItem(child, itemId))
        .filter((c): c is DRERowData => c !== null)
      
      // Se é um grupo de Despesas (8.X) ou Participações (12.X), recalcula valores
      if (item.codPlanoconta.startsWith('8.') || item.codPlanoconta.startsWith('12.')) {
        const newValuesBySheet: Record<string, number> = {}
        sheets.forEach(month => {
          newValuesBySheet[month] = newChildren.reduce((sum, child) => {
            return sum + (child.valuesBySheet[month] || 0)
          }, 0)
        })
        return { ...item, children: newChildren, valuesBySheet: newValuesBySheet }
      }
      
      return { ...item, children: newChildren }
    }
    
    return item
  }
  
  // Primeiro passo: aplicar exclusões e coletar itens movidos
  let filtered = items
    .map(item => processItem(item))
    .filter((i): i is DRERowData => i !== null)
  
  // Segundo passo: adicionar itens movidos aos grupos de destino
  if (itemsToMove.length > 0) {
    filtered = filtered.map(item => {
      if (item.codPlanoconta === '8' && item.children) {
        // Processar grupos de despesas
        const newChildren = item.children.map(grupo => {
          const itemsForThisGroup = itemsToMove.filter(m => m.toGrupo === grupo.codPlanoconta)
          if (itemsForThisGroup.length > 0) {
            const newGrupoChildren = [...(grupo.children || []), ...itemsForThisGroup.map(m => m.item)]
            const newValuesBySheet: Record<string, number> = {}
            sheets.forEach(month => {
              newValuesBySheet[month] = newGrupoChildren.reduce((sum, child) => {
                return sum + (child.valuesBySheet[month] || 0)
              }, 0)
            })
            return { ...grupo, children: newGrupoChildren, valuesBySheet: newValuesBySheet }
          }
          return grupo
        })
        
        // Recalcular total de despesas
        const newValuesBySheet: Record<string, number> = {}
        sheets.forEach(month => {
          newValuesBySheet[month] = newChildren.reduce((sum, child) => {
            return sum + (child.valuesBySheet[month] || 0)
          }, 0)
        })
        return { ...item, children: newChildren, valuesBySheet: newValuesBySheet }
      }
      return item
    })
  }
  
  // Terceiro passo: adicionar itens manuais aos grupos de destino
  if (addedItems.length > 0) {
    filtered = filtered.map(item => {
      if (item.codPlanoconta === '8' && item.children) {
        // Processar grupos de despesas
        const newChildren = item.children.map(grupo => {
          const addedForThisGroup = addedItems.filter(a => a.grupoDestino === grupo.codPlanoconta)
          if (addedForThisGroup.length > 0) {
            // Criar DRERowData para cada item adicionado
            const addedRows: DRERowData[] = addedForThisGroup.map(added => ({
              codPlanoconta: added.id,
              plano: added.descricao,
              subtotal: 0,
              codFormato: 0,
              valuesBySheet: added.valuesByMonth
            }))
            const newGrupoChildren = [...(grupo.children || []), ...addedRows]
            const newValuesBySheet: Record<string, number> = {}
            sheets.forEach(month => {
              newValuesBySheet[month] = newGrupoChildren.reduce((sum, child) => {
                return sum + (child.valuesBySheet[month] || 0)
              }, 0)
            })
            return { ...grupo, children: newGrupoChildren, valuesBySheet: newValuesBySheet }
          }
          return grupo
        })
        
        // Recalcular total de despesas
        const newValuesBySheet: Record<string, number> = {}
        sheets.forEach(month => {
          newValuesBySheet[month] = newChildren.reduce((sum, child) => {
            return sum + (child.valuesBySheet[month] || 0)
          }, 0)
        })
        return { ...item, children: newChildren, valuesBySheet: newValuesBySheet }
      }
      return item
    })
  }
  
  // Quarto passo: recalcular totais de Despesas (8) e Participações (12)
  filtered = recalculateGroupTotals(filtered, sheets)
  
  // Quinto passo: recalcular totais da DRE
  return recalculateTotals(filtered, sheets)
}

/** Recalcula totais de grupos (Despesas e Participações) */
function recalculateGroupTotals(items: DRERowData[], sheets: string[]): DRERowData[] {
  return items.map(item => {
    // Recalcular Despesas (8) baseado nos filhos
    if (item.codPlanoconta === '8' && item.children) {
      const newValuesBySheet: Record<string, number> = {}
      sheets.forEach(month => {
        newValuesBySheet[month] = item.children!.reduce((sum, child) => {
          return sum + (child.valuesBySheet[month] || 0)
        }, 0)
      })
      return { ...item, valuesBySheet: newValuesBySheet }
    }
    
    // Recalcular Participações (12) baseado nos filhos
    if (item.codPlanoconta === '12' && item.children) {
      const newValuesBySheet: Record<string, number> = {}
      sheets.forEach(month => {
        newValuesBySheet[month] = item.children!.reduce((sum, child) => {
          return sum + (child.valuesBySheet[month] || 0)
        }, 0)
      })
      return { ...item, valuesBySheet: newValuesBySheet }
    }
    
    return item
  })
}

/** Recalcula os totais de Despesas e saldos da DRE de forma sequencial
 * Estrutura da DRE:
 * - (=) Lucro Bruto (7) = Receitas - CMV
 * - (-) Despesas (8)
 * - (=) Resultado Operacional (9) = Lucro Bruto + Despesas
 * - (-) Imposto Sob Resultado (10)
 * - (=) Saldo (11) = Resultado Operacional + Imposto Sob Resultado
 * - (-) Participações (12)
 * - (=) Resultado Líquido (13) = Saldo + Participações
 */
function recalculateTotals(items: DRERowData[], sheets: string[]): DRERowData[] {
  // Criar cópia dos itens para modificação
  const result = [...items]
  
  // Função auxiliar para encontrar índice e item
  const findItem = (cod: string) => {
    const idx = result.findIndex(i => i.codPlanoconta === cod)
    return { idx, item: idx >= 0 ? result[idx] : null }
  }
  
  // Função auxiliar para atualizar item no array
  const updateItem = (idx: number, newValues: Record<string, number>, item: DRERowData) => {
    if (idx >= 0) {
      result[idx] = { ...item, valuesBySheet: newValues }
    }
  }
  
  // 1. Recalcular total de Despesas (COD 8) baseado nos filhos
  const { idx: despIdx, item: despesas } = findItem('8')
  if (despesas && despesas.children) {
    const newValuesBySheet: Record<string, number> = {}
    sheets.forEach(month => {
      newValuesBySheet[month] = despesas.children!.reduce((sum, grupo) => {
        return sum + (grupo.valuesBySheet[month] || 0)
      }, 0)
    })
    updateItem(despIdx, newValuesBySheet, despesas)
  }
  
  // 2. Recalcular Resultado Operacional (COD 9) = Lucro Bruto (7) + Despesas (8)
  const { item: lucroBruto } = findItem('7')
  const { idx: roIdx, item: resultadoOp } = findItem('9')
  const despesasAtualizado = result.find(i => i.codPlanoconta === '8')
  
  if (resultadoOp && lucroBruto && despesasAtualizado) {
    const newValuesBySheet: Record<string, number> = {}
    sheets.forEach(month => {
      const lb = lucroBruto.valuesBySheet[month] || 0
      const desp = despesasAtualizado.valuesBySheet[month] || 0
      newValuesBySheet[month] = lb + desp
    })
    updateItem(roIdx, newValuesBySheet, resultadoOp)
  }
  
  // 3. Recalcular Saldo (COD 11) = Resultado Operacional (9) + Imposto Sob Resultado (10)
  const { item: impostoSobResultado } = findItem('10')
  const { idx: saldoIdx, item: saldo } = findItem('11')
  const roAtualizado = result.find(i => i.codPlanoconta === '9')
  
  if (saldo && roAtualizado) {
    const newValuesBySheet: Record<string, number> = {}
    sheets.forEach(month => {
      const ro = roAtualizado.valuesBySheet[month] || 0
      const imposto = impostoSobResultado?.valuesBySheet[month] || 0
      newValuesBySheet[month] = ro + imposto
    })
    updateItem(saldoIdx, newValuesBySheet, saldo)
  }
  
  // 4. Recalcular Resultado Líquido (COD 13) = Saldo (11) + Participações (12)
  const { item: participacoes } = findItem('12')
  const { idx: rlIdx, item: resultadoLiq } = findItem('13')
  const saldoAtualizado = result.find(i => i.codPlanoconta === '11')
  
  if (resultadoLiq && saldoAtualizado) {
    const newValuesBySheet: Record<string, number> = {}
    sheets.forEach(month => {
      const saldoVal = saldoAtualizado.valuesBySheet[month] || 0
      const part = participacoes?.valuesBySheet[month] || 0
      newValuesBySheet[month] = saldoVal + part
    })
    updateItem(rlIdx, newValuesBySheet, resultadoLiq)
  }
  
  return result
}

export default function Home() {
  const [year, setYear] = useState(2025)
  const [expenseSearch, setExpenseSearch] = useState('')
  const { data: dreData, sheets, loading, error } = useDREData(year)
  const { customizations, excludeItem, restoreItem, isItemExcluded, moveItem, addItem, removeAddedItem } = useCustomizations()
  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [variationHighlights, setVariationHighlights] = useState<VariationHighlight[] | null>(null)
  
  // Aplicar customizações (exclusões, movimentos e adições) nos dados da DRE
  const filteredDreData = useMemo(() => {
    if (!customizations) {
      return dreData
    }
    const hasExclusions = customizations.excludedItems.length > 0
    const hasMovements = customizations.movedItems.length > 0
    const hasAdditions = (customizations.addedItems?.length ?? 0) > 0
    if (!hasExclusions && !hasMovements && !hasAdditions) {
      return dreData
    }
    return applyCustomizations(
      dreData, 
      customizations.excludedItems, 
      customizations.movedItems,
      customizations.addedItems || [],
      sheets
    )
  }, [dreData, customizations, sheets])
  
  return (
    <div className="h-screen flex flex-col bg-background-soft dark:bg-dark-background w-full overflow-hidden">
      <Header
        companyName="Demonstrativo de Performance (DRE Gerencial)"
        year={year}
        onYearChange={setYear}
        expenseSearch={expenseSearch}
        onExpenseSearchChange={setExpenseSearch}
        dreData={dreData}
        sheets={sheets}
        tableWrapperRef={tableWrapperRef}
        onHighlights={setVariationHighlights}
        excludedItems={customizations?.excludedItems ?? []}
        onRestoreItem={restoreItem}
        addedItems={customizations?.addedItems ?? []}
        onAddItem={addItem}
        onRemoveAddedItem={removeAddedItem}
      />
      
      <main className="flex-1 min-h-0 flex flex-col w-full max-w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-hidden">
        {error && (
          <Card variant="elevated" className="mb-6 border-danger/20 bg-danger/5">
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
        ) : filteredDreData.length === 0 ? (
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
              items={filteredDreData}
              sheets={sheets}
              expenseSearch={expenseSearch}
              variationHighlights={variationHighlights}
              excludedItems={customizations?.excludedItems ?? []}
              onExcludeItem={excludeItem}
              onRestoreItem={restoreItem}
              isItemExcluded={isItemExcluded}
              onMoveItem={moveItem}
            />
          </div>
        )}
      </main>
    </div>
  )
}
