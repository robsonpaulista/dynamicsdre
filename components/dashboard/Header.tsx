'use client'

import React, { useState, useMemo } from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { DREAnalyst } from '@/components/dashboard/DREAnalyst'
import { Moon, Sun, Search, Trash2, RotateCcw, Plus, X } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { DRERowData, VariationHighlight, AddedItem } from '@/types/dre'

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
  /** IDs dos itens excluídos */
  excludedItems?: string[]
  /** Função para restaurar um item excluído */
  onRestoreItem?: (itemId: string) => Promise<void>
  /** Itens adicionados manualmente */
  addedItems?: AddedItem[]
  /** Função para adicionar um item */
  onAddItem?: (grupoDestino: string, descricao: string, valuesByMonth: Record<string, number>) => Promise<void>
  /** Função para remover um item adicionado */
  onRemoveAddedItem?: (itemId: string) => Promise<void>
}

export function Header({ 
  companyName = 'Empresa',
  year = 2025,
  onYearChange,
  expenseSearch = '',
  onExpenseSearchChange,
  dreData,
  sheets = [],
  tableWrapperRef,
  onHighlights,
  excludedItems = [],
  onRestoreItem,
  addedItems = [],
  onAddItem,
  onRemoveAddedItem,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const inputVariantLight = theme === 'dark'
  const [excludedModalOpen, setExcludedModalOpen] = useState(false)
  const [restoringItem, setRestoringItem] = useState<string | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [removingItem, setRemovingItem] = useState<string | null>(null)
  
  // Formulário de adicionar
  const [newDescricao, setNewDescricao] = useState('')
  const [newGrupo, setNewGrupo] = useState('')
  const [newValor, setNewValor] = useState('')
  const [selectedMonths, setSelectedMonths] = useState<string[]>([])
  
  // Anos disponíveis: 2025 a 2030
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i).map(y => ({
    value: y.toString(),
    label: y.toString(),
  }))
  
  // Nomes dos meses para exibição
  const monthNames: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  }
  
  const formatMonth = (month: string): string => {
    const [yearPart, monthPart] = month.split('-')
    return `${monthNames[monthPart] || monthPart}/${yearPart}`
  }
  
  // Extrair grupos de despesas do dreData
  const despesaGrupos = useMemo(() => {
    const despesas = dreData?.find(i => i.codPlanoconta === '8')
    return despesas?.children?.map(g => ({
      value: g.codPlanoconta,
      label: g.plano
    })) ?? []
  }, [dreData])
  
  const handleYearChange = (value: string) => {
    if (onYearChange) {
      onYearChange(parseInt(value, 10))
    }
  }
  
  const handleRestoreItem = async (itemId: string) => {
    if (!onRestoreItem || restoringItem) return
    setRestoringItem(itemId)
    try {
      await onRestoreItem(itemId)
    } finally {
      setRestoringItem(null)
    }
  }
  
  const toggleMonth = (month: string) => {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    )
  }
  
  const selectAllMonths = () => {
    setSelectedMonths([...sheets])
  }
  
  const clearMonths = () => {
    setSelectedMonths([])
  }
  
  const handleAddItem = async () => {
    if (!onAddItem || isAdding || !newDescricao.trim() || !newGrupo || selectedMonths.length === 0) return
    setIsAdding(true)
    try {
      // Converter valor para número negativo (despesa)
      const valorNum = parseFloat(newValor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
      const valorNegativo = valorNum > 0 ? -valorNum : valorNum
      
      // Criar valores apenas para os meses selecionados
      const valuesByMonth: Record<string, number> = {}
      selectedMonths.forEach(month => {
        valuesByMonth[month] = valorNegativo
      })
      
      await onAddItem(newGrupo, newDescricao.trim(), valuesByMonth)
      
      // Limpar formulário
      setNewDescricao('')
      setNewGrupo('')
      setNewValor('')
      setSelectedMonths([])
      setAddModalOpen(false)
    } finally {
      setIsAdding(false)
    }
  }
  
  const handleCloseAddModal = () => {
    setAddModalOpen(false)
    // Não limpar o formulário ao fechar, para permitir continuar depois
  }
  
  const handleRemoveAddedItem = async (itemId: string) => {
    if (!onRemoveAddedItem || removingItem) return
    setRemovingItem(itemId)
    try {
      await onRemoveAddedItem(itemId)
    } finally {
      setRemovingItem(null)
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
            {/* Botão de adicionar despesa */}
            {onAddItem && despesaGrupos.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="relative rounded-full p-1 hover:bg-primary/10 dark:hover:bg-white/15"
                aria-label="Adicionar despesa"
                title="Adicionar despesa manual"
              >
                <span className="flex items-center justify-center rounded-full p-1.5 bg-success dark:bg-success">
                  <Plus className="h-5 w-5 text-white" />
                </span>
                {addedItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {addedItems.length}
                  </span>
                )}
              </Button>
            )}
            {/* Botão de itens excluídos */}
            {excludedItems.length > 0 && onRestoreItem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExcludedModalOpen(true)}
                className="relative rounded-full p-1 hover:bg-primary/10 dark:hover:bg-white/15"
                aria-label="Itens excluídos da DRE"
                title="Ver itens excluídos"
              >
                <span className="flex items-center justify-center rounded-full p-1.5 bg-warning dark:bg-warning">
                  <Trash2 className="h-5 w-5 text-white" />
                </span>
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-bold text-white">
                  {excludedItems.length}
                </span>
              </Button>
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
      
      {/* Modal de adicionar despesa */}
      <Modal
        isOpen={addModalOpen}
        onClose={handleCloseAddModal}
        title="Adicionar Despesa Manual"
        headerVariant="primary"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Adicione uma despesa que não existe na planilha. Selecione os meses desejados.
          </p>
          
          {/* Itens já adicionados */}
          {addedItems.length > 0 && (
            <div className="border-b border-border dark:border-dark-border pb-4 mb-4">
              <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2">
                Itens adicionados ({addedItems.length}):
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {addedItems.map((item) => {
                  const grupo = despesaGrupos.find(g => g.value === item.grupoDestino)
                  const meses = Object.keys(item.valuesByMonth).sort()
                  const valorTotal = Object.values(item.valuesByMonth).reduce((a, b) => a + b, 0)
                  return (
                    <div
                      key={item.id}
                      className="p-2 rounded border border-border dark:border-dark-border bg-background-soft/50 dark:bg-dark-primary-surface/50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary dark:text-dark-text-primary">
                            {item.descricao}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                            {grupo?.label || item.grupoDestino}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveAddedItem(item.id)}
                          disabled={removingItem === item.id}
                          className="p-1 rounded hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                          title="Remover todos os meses"
                        >
                          <X className={cn('h-4 w-4', removingItem === item.id && 'animate-spin')} />
                        </button>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {meses.map(mes => (
                          <span 
                            key={mes} 
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-primary/10 dark:bg-dark-primary/20 text-primary dark:text-dark-primary"
                            title={`${formatMonth(mes)}: ${formatCurrency(item.valuesByMonth[mes])}`}
                          >
                            {formatMonth(mes)}: {formatCurrency(item.valuesByMonth[mes])}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-secondary dark:text-dark-text-secondary mt-1">
                        Total: {formatCurrency(valorTotal)}
                      </p>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-2 italic">
                Dica: Para adicionar mais meses a uma despesa existente, use o mesmo grupo e descrição.
              </p>
            </div>
          )}
          
          {/* Grupo de destino */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
              Grupo de Despesas
            </label>
            <Select
              value={newGrupo}
              onValueChange={setNewGrupo}
              options={despesaGrupos}
              placeholder="Selecione o grupo..."
              className="w-full"
            />
          </div>
          
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={newDescricao}
              onChange={(e) => setNewDescricao(e.target.value)}
              placeholder="Ex: Consultoria Externa"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
                'placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary/50',
                'focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary',
                'border-border dark:border-dark-border bg-background dark:bg-dark-card text-text-primary dark:text-dark-text-primary'
              )}
            />
          </div>
          
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-1">
              Valor (R$)
            </label>
            <input
              type="text"
              value={newValor}
              onChange={(e) => setNewValor(e.target.value)}
              placeholder="Ex: 1500,00"
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
                'placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary/50',
                'focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary',
                'border-border dark:border-dark-border bg-background dark:bg-dark-card text-text-primary dark:text-dark-text-primary'
              )}
            />
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary mt-1">
              O valor será registrado como despesa (negativo) nos meses selecionados.
            </p>
          </div>
          
          {/* Seleção de meses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Meses ({selectedMonths.length} de {sheets.length} selecionados)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllMonths}
                  className="text-xs text-primary dark:text-dark-primary hover:underline"
                >
                  Todos
                </button>
                <span className="text-text-secondary">|</span>
                <button
                  type="button"
                  onClick={clearMonths}
                  className="text-xs text-primary dark:text-dark-primary hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sheets.map(month => (
                <button
                  key={month}
                  type="button"
                  onClick={() => toggleMonth(month)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
                    selectedMonths.includes(month)
                      ? 'bg-primary text-white border-primary dark:bg-dark-primary dark:border-dark-primary'
                      : 'bg-background dark:bg-dark-card text-text-secondary dark:text-dark-text-secondary border-border dark:border-dark-border hover:border-primary dark:hover:border-dark-primary'
                  )}
                >
                  {formatMonth(month)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Botão adicionar */}
          <Button
            variant="primary"
            onClick={handleAddItem}
            disabled={isAdding || !newDescricao.trim() || !newGrupo || selectedMonths.length === 0}
            className="w-full"
          >
            {isAdding ? 'Adicionando...' : `Adicionar em ${selectedMonths.length} ${selectedMonths.length === 1 ? 'mês' : 'meses'}`}
          </Button>
        </div>
      </Modal>
      
      {/* Modal de itens excluídos */}
      <Modal
        isOpen={excludedModalOpen}
        onClose={() => setExcludedModalOpen(false)}
        title="Itens Excluídos da DRE"
        headerVariant="warning"
      >
        <div className="space-y-2">
          {excludedItems.length === 0 ? (
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary text-center py-4">
              Nenhum item excluído.
            </p>
          ) : (
            <>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                Os itens abaixo foram excluídos da DRE. Clique em restaurar para incluí-los novamente.
              </p>
              {excludedItems.map((itemId) => (
                <div
                  key={itemId}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border dark:border-dark-border bg-background-soft dark:bg-dark-primary-surface"
                >
                  <span className="text-sm text-text-primary dark:text-dark-text-primary font-medium truncate">
                    {itemId}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreItem(itemId)}
                    disabled={restoringItem === itemId}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <RotateCcw className={cn('h-4 w-4', restoringItem === itemId && 'animate-spin')} />
                    Restaurar
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>
    </header>
  )
}
