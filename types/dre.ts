export interface DREItemData {
  id: string
  label: string
  value: number
  percent?: number
  children?: DREItemData[]
  type?: 'revenue' | 'cost' | 'expense' | 'result'
}

export interface DRERowData {
  codPlanoconta: string
  plano: string
  subtotal: number
  codFormato: number
  valuesBySheet: Record<string, number> // sheetName -> valor
  lancamentos?: LancamentoData[] // Para despesas: lançamentos individuais com histórico
  children?: DRERowData[] // Para despesas: estrutura hierárquica DESCGRUPOCONTA -> CONTA
}

export interface LancamentoData {
  historico: string
  valor: number
  data: string // YYYY-MM
  conta: string
}

export interface MetricData {
  title: string
  value: number
  change?: number
  changeType?: 'percent' | 'currency'
  variant?: 'default' | 'highlight'
}

export interface ChartData {
  month: string
  revenue: number
  expenses: number
  margin: number
}

export interface PeriodData {
  value: string
  label: string
}

/** Destaque de variação: célula (conta + mês) com variação acima do limite. */
export interface VariationHighlight {
  codPlanoconta: string
  mesAnterior: string
  mesAtual: string
  variacaoPercentual: number
  valorAnterior: number
  valorAtual: number
}

/** Item adicionado manualmente pelo usuário */
export interface AddedItem {
  /** ID único do item adicionado */
  id: string
  /** Grupo de destino (ex.: "8.DESPESAS ADM") */
  grupoDestino: string
  /** Descrição/nome da despesa */
  descricao: string
  /** Valores por mês (ex.: { "2025-01": -1500, "2025-02": -1500 }) */
  valuesByMonth: Record<string, number>
  /** Data de criação */
  createdAt: string
}

/** Customizações da DRE: itens excluídos, movidos ou adicionados. */
export interface DRECustomizations {
  /** IDs dos itens excluídos (ex.: "8.DESPESAS ADM", "8.DESPESAS ADM.ALUGUEL", "12.PARTICIPACOES") */
  excludedItems: string[]
  /** Itens movidos de um grupo para outro */
  movedItems: Array<{
    codPlanoconta: string
    fromGrupo: string
    toGrupo: string
  }>
  /** Itens adicionados manualmente */
  addedItems: AddedItem[]
  /** Data da última atualização */
  updatedAt?: string
}
