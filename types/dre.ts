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
