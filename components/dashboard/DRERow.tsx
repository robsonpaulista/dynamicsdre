'use client'

import React, { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown, Info, TrendingUp, TrendingDown, X, ArrowRightLeft } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import type { DRERowData, VariationHighlight } from '@/types/dre'

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

function formatMonthName(month: string): string {
  try {
    const [year, monthNum] = month.split('-')
    const monthIndex = parseInt(monthNum, 10) - 1
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${MONTH_NAMES[monthIndex]}/${year}`
    }
    return month
  } catch {
    return month
  }
}

function formatMonthShort(month: string): string {
  try {
    const monthNum = month.split('-')[1]
    const monthIndex = parseInt(monthNum, 10) - 1
    return monthIndex >= 0 && monthIndex < 12 ? MONTH_NAMES[monthIndex] : month
  } catch {
    return month
  }
}

/** Mini gráfico de linhas para os valores da conta ao longo dos meses.
 * invertY: para despesas, true = valor mais negativo (aumento) sobe no gráfico. */
function SparklineChart({
  values,
  labels,
  width = 232,
  height = 44,
  currentIndex,
  accentClass,
  invertY = false,
}: {
  values: number[]
  labels?: string[]
  width?: number
  height?: number
  currentIndex?: number
  accentClass?: string
  invertY?: boolean
}) {
  if (values.length < 2) return null
  const pad = 2
  const labelHeight = labels && labels.length > 0 ? 14 : 0
  const chartHeight = height - labelHeight
  const w = width - pad * 2
  const h = chartHeight - pad * 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const n = values.length
  const points = values.map((v, i) => {
    const x = pad + (i / (n - 1)) * w
    const yNormal = pad + h - ((v - min) / range) * h
    const y = invertY ? pad + ((v - min) / range) * h : yNormal
    return `${x},${y}`
  }).join(' ')
  const getCy = (v: number) =>
    invertY ? pad + ((v - min) / range) * h : pad + h - ((v - min) / range) * h
  return (
    <div className="w-full" style={{ width }}>
      <svg width={width} height={chartHeight} className="overflow-visible block" aria-hidden>
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={accentClass ?? 'text-primary dark:text-dark-primary opacity-80'}
          points={points}
        />
        {currentIndex != null && currentIndex >= 0 && currentIndex < values.length && (
          <circle
            r="3"
            cx={pad + (currentIndex / (n - 1)) * w}
            cy={getCy(values[currentIndex])}
            className={accentClass ?? 'fill-primary dark:fill-dark-primary'}
          />
        )}
      </svg>
      {labels && labels.length === values.length && (
        <div className="relative text-[10px] text-text-secondary dark:text-dark-text-secondary" style={{ width, height: labelHeight }}>
          {labels.map((label, i) => (
            <span
              key={i}
              className="absolute truncate max-w-[2.5rem]"
              style={{
                left: pad + (i / (n - 1)) * w,
                transform: 'translateX(-50%)',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** Grupo de despesas disponível para mover itens */
interface DespesaGrupo {
  codPlanoconta: string
  plano: string
}

interface DRERowProps {
  item: DRERowData
  sheets: string[]
  receitaPorMes: Map<string, number>
  level?: number
  index?: number
  getTypeStyles: () => string
  getValueStyles: (value: number) => string
  variationHighlights?: VariationHighlight[]
  expenseSearch?: string
  initialExpanded?: boolean
  /** Caminho do item pai (para construir o itemId completo) */
  parentPath?: string
  /** IDs dos itens excluídos */
  excludedItems?: string[]
  /** Função para excluir um item */
  onExcludeItem?: (itemId: string) => Promise<void>
  /** Função para restaurar um item excluído */
  onRestoreItem?: (itemId: string) => Promise<void>
  /** Função para verificar se um item está excluído */
  isItemExcluded?: (itemId: string) => boolean
  /** Lista de grupos de despesas disponíveis para mover */
  despesaGrupos?: DespesaGrupo[]
  /** Função para mover um item para outro grupo */
  onMoveItem?: (codPlanoconta: string, fromGrupo: string, toGrupo: string) => Promise<void>
}

export function DRERow({ 
  item, 
  sheets, 
  receitaPorMes, 
  level = 0, 
  index = 0, 
  getTypeStyles, 
  getValueStyles, 
  variationHighlights, 
  expenseSearch, 
  initialExpanded,
  parentPath = '',
  excludedItems = [],
  onExcludeItem,
  onRestoreItem,
  isItemExcluded,
  despesaGrupos = [],
  onMoveItem
}: DRERowProps) {
  // Despesas Fixas/Variáveis (COD 8) e Participações (COD 12) começam recolhidos; demais níveis raiz expandidos
  const startsExpanded = (level < 1 && item.codPlanoconta !== '8' && item.codPlanoconta !== '12') || !!initialExpanded
  const [isExpanded, setIsExpanded] = useState(startsExpanded)
  useEffect(() => {
    if (initialExpanded) setIsExpanded(true)
  }, [initialExpanded])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [isExcluding, setIsExcluding] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const hasLancamentos = item.lancamentos && item.lancamentos.length > 0
  const isSubtotal = item.subtotal === 1
  
  // Construir o ID do item para exclusão
  const itemId = parentPath ? `${parentPath}.${item.plano}` : item.codPlanoconta
  
  // Identificar o grupo atual (para mover)
  const currentGrupo = parentPath.startsWith('8.') ? parentPath.split('.').slice(0, 2).join('.') : 
                       item.codPlanoconta.startsWith('8.') && !item.codPlanoconta.includes('.', 2) ? item.codPlanoconta : ''
  
  // Verificar se pode ser excluído (despesas, participações e seus filhos, não subtotais)
  const isDespesaOrChild = item.codPlanoconta.startsWith('8.') || parentPath.startsWith('8')
  const isParticipacaoOrChild = item.codPlanoconta.startsWith('12.') || parentPath.startsWith('12')
  const canExclude = (
    (isDespesaOrChild || isParticipacaoOrChild) && 
    !isSubtotal &&
    onExcludeItem
  )
  
  // Verificar se pode ser movido (apenas contas de despesas folha, não grupos)
  const canMove = (
    parentPath.startsWith('8.') &&  // É filho de um grupo de despesas
    !hasChildren &&                  // Não tem filhos (é conta folha)
    !isSubtotal &&                   // Não é subtotal
    onMoveItem &&
    despesaGrupos.length > 0
  )
  
  const handleExclude = async () => {
    if (!onExcludeItem || isExcluding) return
    setIsExcluding(true)
    try {
      await onExcludeItem(itemId)
    } finally {
      setIsExcluding(false)
    }
  }
  
  const handleMove = async (toGrupo: string) => {
    if (!onMoveItem || isMoving || !currentGrupo) return
    setIsMoving(true)
    try {
      await onMoveItem(item.codPlanoconta, currentGrupo, toGrupo)
      setMoveModalOpen(false)
    } finally {
      setIsMoving(false)
    }
  }
  
  // Verificar se é despesa (COD 8) ou participação (COD 12) ou filhos deles
  const isDespesaOuParticipacao = item.codPlanoconta === '8' || 
                                   item.codPlanoconta === '12' || 
                                   item.codPlanoconta.startsWith('8.') || 
                                   item.codPlanoconta.startsWith('12.')
  
  // Calcular acumulado
  const acumulado = sheets.reduce((sum, month) => {
    return sum + (item.valuesBySheet[month] || 0)
  }, 0)

  const handleDoubleClick = (month: string) => {
    if (hasLancamentos && isDespesaOuParticipacao) {
      const lancamentosDoMes = item.lancamentos!.filter(lanc => lanc.data === month)
      if (lancamentosDoMes.length > 0) {
        setSelectedMonth(month)
        setModalOpen(true)
      }
    }
  }

  // Função para determinar se melhorou ou piorou em relação ao mês anterior
  const getTrend = (currentValue: number, previousValue: number | undefined, monthIndex: number): 'up' | 'down' | null => {
    if (monthIndex === 0 || previousValue === undefined) return null
    
    const cod = item.codPlanoconta.toLowerCase()
    const isReceita = cod.startsWith('1')
    const isDespesa = cod.startsWith('8') || cod.startsWith('12') || cod.startsWith('2') || cod.startsWith('3') || cod.startsWith('4') || cod.startsWith('6') || cod.startsWith('10')
    
    if (isReceita) {
      // Para receitas: maior é melhor
      return currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : null
    } else if (isDespesa) {
      // Para despesas/custos: menor é melhor (valor absoluto)
      const currentAbs = Math.abs(currentValue)
      const previousAbs = Math.abs(previousValue)
      return currentAbs < previousAbs ? 'up' : currentAbs > previousAbs ? 'down' : null
    } else {
      // Para resultados: maior é melhor
      return currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : null
    }
  }

  return (
    <>
      <tr 
        key={item.codPlanoconta || index}
        className={cn(
          'border-b border-border dark:border-dark-border hover:bg-background-soft dark:hover:bg-dark-primary-surface transition-colors group/row',
          level > 0 && 'bg-background-soft/50 dark:bg-dark-primary-surface/30',
          isSubtotal && 'font-semibold'
        )}
      >
        {/* Plano de Contas — largura fixa para alinhar ao cabeçalho */}
        <td className={cn(
          'px-4 py-3 w-[280px] min-w-[280px] transition-colors',
          level > 0 
            ? 'bg-background-soft dark:bg-dark-primary-surface' 
            : 'bg-background dark:bg-dark-card'
        )}>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 20}px` }}>
            {hasChildren && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0.5 hover:bg-background-soft dark:hover:bg-dark-primary-surface rounded transition-colors flex-shrink-0"
                aria-label={isExpanded ? 'Recolher' : 'Expandir'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-text-secondary dark:text-dark-text-secondary" />
                )}
              </button>
            )}
            {!hasChildren && level > 0 && (
              <span className="w-5 flex-shrink-0" />
            )}
            <span
              className={cn(
                'text-xs flex-1',
                isSubtotal && 'font-semibold',
                level === 0 && 'font-semibold',
                getTypeStyles()
              )}
              title={item.plano || item.codPlanoconta}
            >
              {item.plano || item.codPlanoconta}
            </span>
            {/* Botão de mover para outro grupo */}
            {canMove && (
              <button
                onClick={() => setMoveModalOpen(true)}
                disabled={isMoving}
                className={cn(
                  'p-1 rounded hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors opacity-0 group-hover/row:opacity-100',
                  'text-text-secondary dark:text-dark-text-secondary hover:text-primary dark:hover:text-dark-primary',
                  isMoving && 'cursor-wait opacity-50'
                )}
                title="Mover para outro grupo"
                aria-label={`Mover ${item.plano || item.codPlanoconta} para outro grupo`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {/* Botão de excluir para despesas */}
            {canExclude && (
              <button
                onClick={handleExclude}
                disabled={isExcluding}
                className={cn(
                  'p-1 rounded hover:bg-danger/10 dark:hover:bg-danger/20 transition-colors opacity-0 group-hover/row:opacity-100',
                  'text-text-secondary dark:text-dark-text-secondary hover:text-danger dark:hover:text-dark-danger',
                  isExcluding && 'cursor-wait opacity-50'
                )}
                title="Excluir da DRE"
                aria-label={`Excluir ${item.plano || item.codPlanoconta} da DRE`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </td>
        
        {/* Valores por mês com porcentagem */}
        {sheets.map((month, monthIndex) => {
          const value = item.valuesBySheet[month] || 0
          const receitaBruta = receitaPorMes.get(month) || 0
          const percentualSobreReceita = receitaBruta !== 0 ? (value / receitaBruta) * 100 : null
          const previousMonth = monthIndex > 0 ? sheets[monthIndex - 1] : undefined
          const previousValue = previousMonth ? (item.valuesBySheet[previousMonth] || 0) : undefined
          const trend = getTrend(value, previousValue, monthIndex)
          const lancamentosDoMes = hasLancamentos
            ? item.lancamentos!.filter(lanc => lanc.data === month)
            : []

          const highlight = variationHighlights?.find(
            (h) => h.codPlanoconta === item.codPlanoconta && h.mesAtual === month
          )
          const variacaoLocal =
            previousValue !== undefined && previousValue !== 0
              ? ((value - previousValue) / Math.abs(previousValue)) * 100
              : value !== 0
                ? 100
                : null
          const rawVariacaoPercent = highlight != null ? highlight.variacaoPercentual : variacaoLocal
          const variacaoDisplay = rawVariacaoPercent != null && isDespesaOuParticipacao
            ? -rawVariacaoPercent
            : rawVariacaoPercent
          const variacaoText =
            highlight != null && variacaoDisplay != null
              ? `Var. ${formatMonthName(highlight.mesAnterior)} → ${formatMonthName(highlight.mesAtual)}: ${variacaoDisplay > 0 ? 'Aumento ' : 'Redução '}${variacaoDisplay > 0 ? '+' : ''}${variacaoDisplay.toFixed(2)}%`
              : variacaoLocal != null && variacaoDisplay != null
                ? `Var. vs mês ant.: ${variacaoDisplay > 0 ? 'Aumento ' : 'Redução '}${variacaoDisplay > 0 ? '+' : ''}${variacaoDisplay.toFixed(2)}%`
                : null
          const percentualText =
            percentualSobreReceita != null && value !== 0
              ? isDespesaOuParticipacao
                ? `${Math.abs(percentualSobreReceita).toFixed(2)}% da receita operacional líquida (despesa)`
                : `${percentualSobreReceita.toFixed(2)}% da receita operacional líquida`
              : null

          // Média dos meses anteriores ao selecionado (Jan até mês ant.)
          const mesesAnteriores = sheets.slice(0, monthIndex)
          const mediaMesesAnteriores =
            mesesAnteriores.length > 0
              ? mesesAnteriores.reduce((s, m) => s + (item.valuesBySheet[m] || 0), 0) / mesesAnteriores.length
              : null
          const variacaoVsMediaRaw =
            mediaMesesAnteriores != null && mediaMesesAnteriores !== 0
              ? ((value - mediaMesesAnteriores) / Math.abs(mediaMesesAnteriores)) * 100
              : null
          const variacaoVsMedia =
            variacaoVsMediaRaw != null && isDespesaOuParticipacao ? -variacaoVsMediaRaw : variacaoVsMediaRaw
          const mediaLabel =
            mesesAnteriores.length > 0
              ? `Média (${formatMonthName(mesesAnteriores[0])}–${formatMonthName(mesesAnteriores[mesesAnteriores.length - 1])})`
              : null
          const mediaValueText =
            mediaMesesAnteriores != null && isDespesaOuParticipacao
              ? formatCurrency(Math.abs(mediaMesesAnteriores)) + ' (despesa)'
              : mediaMesesAnteriores != null
                ? formatCurrency(mediaMesesAnteriores)
                : null

          // Valores do ano para o mini gráfico (12 meses)
          const valoresAno = sheets.map((m) => item.valuesBySheet[m] || 0)

          return (
            <React.Fragment key={month}>
              <td
                className={cn(
                  'px-4 py-3 text-right text-xs relative',
                  isSubtotal && 'font-semibold',
                  getValueStyles(value),
                  highlight && 'bg-warning/20 dark:bg-warning/15'
                )}
              >
                <div className="flex items-center justify-end gap-1.5">
                  {hasLancamentos && lancamentosDoMes.length > 0 ? (
                    <>
                      {isDespesaOuParticipacao ? (
                        <div
                          className="group/tooltip relative inline-flex items-center gap-1 cursor-pointer select-none"
                          onDoubleClick={() => handleDoubleClick(month)}
                        >
                          <span>{value !== 0 ? formatCurrency(value) : '-'}</span>
                          <Info className="h-3.5 w-3.5 text-text-secondary dark:text-dark-text-secondary opacity-60 group-hover/tooltip:opacity-100 transition-opacity" />
                          <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-[100] w-72 bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-lg p-3">
                            {variacaoText && (
                              <div className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                                {variacaoText}
                              </div>
                            )}
                            {mediaLabel != null && mediaValueText != null && (
                              <div className="text-xs text-text-secondary dark:text-dark-text-secondary mb-1">
                                {mediaLabel}: {mediaValueText}
                                {variacaoVsMedia != null && (
                                  <span className="ml-1 font-medium">
                                    (Var. vs média: {variacaoVsMedia > 0 ? '+' : ''}{variacaoVsMedia.toFixed(1)}%)
                                  </span>
                                )}
                              </div>
                            )}
                            {percentualText && (
                              <div className="text-xs text-text-secondary dark:text-dark-text-secondary mb-2">
                                {percentualText}
                              </div>
                            )}
                            {valoresAno.length >= 2 && (
                              <div className="mb-2">
                                <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary mb-0.5">Evolução no ano</p>
                                <SparklineChart values={valoresAno} labels={sheets.map(formatMonthShort)} currentIndex={monthIndex} invertY={isDespesaOuParticipacao} />
                              </div>
                            )}
                            <div className="text-xs text-text-secondary dark:text-dark-text-secondary">
                              Duplo clique para ver lançamentos
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="group/tooltip relative inline-flex items-center gap-1">
                          <span>{value !== 0 ? formatCurrency(value) : '-'}</span>
                          <Info className="h-3.5 w-3.5 text-text-secondary dark:text-dark-text-secondary cursor-help opacity-60 group-hover/tooltip:opacity-100 transition-opacity" />
                          <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-[100] w-80 bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-lg p-3">
                            <div className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                              Lançamentos ({formatMonthName(month)}):
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-1">
                              {lancamentosDoMes.map((lanc, idx) => (
                                <div key={idx} className="text-xs text-text-secondary dark:text-dark-text-secondary border-b border-border dark:border-dark-border pb-1 last:border-0">
                                  <div className="font-medium">{lanc.historico || 'Sem histórico'}</div>
                                  <div className="flex justify-end mt-0.5">
                                    <span className={getValueStyles(lanc.valor)}>
                                      {formatCurrency(lanc.valor)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : isDespesaOuParticipacao ? (
                    <div className="group/tooltip relative inline-flex items-center gap-1">
                      <span>{value !== 0 ? formatCurrency(value) : '-'}</span>
                      <Info className="h-3.5 w-3.5 text-text-secondary dark:text-dark-text-secondary cursor-help opacity-60 group-hover/tooltip:opacity-100 transition-opacity" />
                      <div className="absolute right-0 top-full mt-2 hidden group-hover/tooltip:block z-[100] w-72 bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-lg shadow-lg p-3">
                        {variacaoText && (
                          <div className="text-xs font-semibold text-text-primary dark:text-dark-text-primary mb-1">
                            {variacaoText}
                          </div>
                        )}
                        {mediaLabel != null && mediaValueText != null && (
                          <div className="text-xs text-text-secondary dark:text-dark-text-secondary mb-1">
                            {mediaLabel}: {mediaValueText}
                            {variacaoVsMedia != null && (
                              <span className="ml-1 font-medium">
                                (Var. vs média: {variacaoVsMedia > 0 ? '+' : ''}{variacaoVsMedia.toFixed(1)}%)
                              </span>
                            )}
                          </div>
                        )}
                        {percentualText && (
                          <div className="text-xs text-text-secondary dark:text-dark-text-secondary mb-2">
                            {percentualText}
                          </div>
                        )}
                        {valoresAno.length >= 2 && (
                          <div className="mb-2">
                            <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary mb-0.5">Evolução no ano</p>
                            <SparklineChart values={valoresAno} labels={sheets.map(formatMonthShort)} currentIndex={monthIndex} invertY={isDespesaOuParticipacao} />
                          </div>
                        )}
                        {!variacaoText && !percentualText && mediaLabel == null && (
                          <div className="text-xs text-text-secondary dark:text-dark-text-secondary">
                            Sem variação (mês anterior)
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span>{value !== 0 ? formatCurrency(value) : '-'}</span>
                  )}
                  {/* Ícone de tendência discreto */}
                  {trend && value !== 0 && (
                    <span className="inline-flex items-center opacity-50">
                      {trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-success dark:text-dark-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-danger dark:text-dark-danger" />
                      )}
                    </span>
                  )}
                </div>
              </td>
            </React.Fragment>
          )
        })}
        
        {/* Acumulado */}
        <td className={cn(
          'px-4 py-3 text-right text-xs',
          isSubtotal && 'font-semibold',
          getValueStyles(acumulado)
        )}>
          {acumulado !== 0 ? formatCurrency(acumulado) : '-'}
        </td>
      </tr>
      
      {/* Renderizar filhos se expandido */}
      {hasChildren && isExpanded && item.children!.map((child, childIndex) => (
        <DRERow
          key={child.codPlanoconta || childIndex}
          item={child}
          sheets={sheets}
          receitaPorMes={receitaPorMes}
          level={level + 1}
          index={childIndex}
          getTypeStyles={getTypeStyles}
          getValueStyles={getValueStyles}
          variationHighlights={variationHighlights}
          expenseSearch={expenseSearch}
          initialExpanded={!!((variationHighlights?.length || expenseSearch?.trim()) && child.codPlanoconta.startsWith('8.'))}
          parentPath={itemId}
          excludedItems={excludedItems}
          onExcludeItem={onExcludeItem}
          onRestoreItem={onRestoreItem}
          isItemExcluded={isItemExcluded}
          despesaGrupos={despesaGrupos}
          onMoveItem={onMoveItem}
        />
      ))}
      
      {/* Modal para mover despesa para outro grupo */}
      {canMove && (
        <Modal
          isOpen={moveModalOpen}
          onClose={() => setMoveModalOpen(false)}
          title={`Mover: ${item.plano || item.codPlanoconta}`}
          headerVariant="primary"
        >
          <div className="space-y-3">
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
              Selecione o grupo de destino para mover esta despesa:
            </p>
            {despesaGrupos
              .filter(g => g.codPlanoconta !== currentGrupo) // Não mostrar o grupo atual
              .map((grupo) => (
                <button
                  key={grupo.codPlanoconta}
                  onClick={() => handleMove(grupo.codPlanoconta)}
                  disabled={isMoving}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border border-border dark:border-dark-border',
                    'hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary dark:hover:border-dark-primary',
                    'transition-colors',
                    isMoving && 'cursor-wait opacity-50'
                  )}
                >
                  <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    {grupo.plano}
                  </span>
                </button>
              ))}
          </div>
        </Modal>
      )}
      
      {/* Modal para despesas e participações */}
      {isDespesaOuParticipacao && selectedMonth && (
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setSelectedMonth(null)
          }}
          title={`${item.plano || item.codPlanoconta} - Lançamentos (${formatMonthName(selectedMonth)})`}
          headerVariant="primary"
        >
          <div className="space-y-3">
            {item.lancamentos!
              .filter(lanc => lanc.data === selectedMonth)
              .sort((a, b) => a.valor - b.valor)
              .map((lanc, idx) => (
                <div 
                  key={idx} 
                  className="border-b border-border dark:border-dark-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-medium text-xs text-text-primary dark:text-dark-text-primary flex-1">
                      {lanc.historico || 'Sem histórico'}
                    </div>
                    <span className={cn('text-xs font-semibold whitespace-nowrap', getValueStyles(lanc.valor))}>
                      {formatCurrency(lanc.valor)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Modal>
      )}
    </>
  )
}
