import { extractMonthFromDate } from './googleSheets'
import type { LancamentoData } from '@/types/dre'

export interface ParticipacaoRow {
  conta: string
  valor: number
  data: string // YYYY-MM
  historico?: string
}

export interface ParticipacaoAgrupada {
  conta: string
  valoresPorMes: Record<string, number>
  lancamentos: LancamentoData[]
}

/**
 * Parseia dados da aba de participações
 * Agrupa por CONTA -> lançamentos individuais
 */
export function parseParticipacoesData(rows: string[][]): ParticipacaoRow[] {
  if (!rows || rows.length < 2) return []

  // Primeira linha são os cabeçalhos
  const headers = rows[0].map((h) => h.toString().trim())
  const headersLower = headers.map((h) => h.toLowerCase())

  // Encontrar índices das colunas
  let contaIndex = headersLower.findIndex((h) => h === 'conta')
  if (contaIndex === -1) {
    contaIndex = headersLower.findIndex((h) =>
      h.includes('conta') && !h.includes('cod') && !h.includes('grupo')
    )
  }

  let historicoIndex = headersLower.findIndex((h) => h === 'historico')
  if (historicoIndex === -1) {
    historicoIndex = headersLower.findIndex((h) =>
      h.includes('historico') ||
      h.includes('histórico')
    )
  }

  let dataIndex = headersLower.findIndex((h) => h === 'data')
  if (dataIndex === -1) {
    dataIndex = headersLower.findIndex((h) =>
      h.includes('data') ||
      h.includes('dtemissao') ||
      h.includes('dataemissao')
    )
  }
  if (dataIndex === -1) {
    dataIndex = headersLower.findIndex((h) => h.includes('dt') && !h.includes('cod'))
  }

  let valorIndex = headersLower.findIndex((h) => h === 'valor')
  if (valorIndex === -1) {
    valorIndex = headersLower.findIndex((h) =>
      h.includes('valor') ||
      h.includes('vltotal')
    )
  }
  if (valorIndex === -1) {
    valorIndex = headersLower.findIndex((h) =>
      h.includes('total') && !h.includes('subtotal')
    )
  }

  if (contaIndex === -1 || valorIndex === -1 || dataIndex === -1) {
    throw new Error(`Estrutura da planilha de participações inválida: colunas obrigatórias não encontradas`)
  }

  // Processar linhas de dados
  const dataRows: ParticipacaoRow[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const conta = row[contaIndex]?.toString().trim() || ''
    const historico = historicoIndex >= 0 ? (row[historicoIndex]?.toString().trim() || '') : ''

    // Pular linhas vazias
    if (!conta) continue

    // Parsear valor
    let valor = 0
    if (valorIndex >= 0 && row[valorIndex]) {
      const valorStr = row[valorIndex].toString().trim()
      const cleaned = valorStr.replace(/[^\d.,-]/g, '')

      if (cleaned && cleaned !== '' && cleaned !== '-') {
        if (cleaned.includes('.') && cleaned.includes(',')) {
          const brFormat = cleaned.replace(/\./g, '').replace(',', '.')
          valor = parseFloat(brFormat) || 0
        } else if (cleaned.includes(',')) {
          valor = parseFloat(cleaned.replace(',', '.')) || 0
        } else if (cleaned.includes('.')) {
          const parts = cleaned.split('.')
          if (parts.length === 2) {
            valor = parseFloat(cleaned) || 0
          } else if (parts.length > 2) {
            valor = parseFloat(cleaned.replace(/\./g, '')) || 0
          } else {
            valor = parseFloat(cleaned) || 0
          }
        } else {
          valor = parseFloat(cleaned) || 0
        }
      }
    }

    // Extrair data
    let data: string | undefined
    if (dataIndex >= 0 && row[dataIndex]) {
      const monthKey = extractMonthFromDate(row[dataIndex])
      if (monthKey) {
        data = monthKey
      }
    }

    if (!data) continue // Pular se não tiver data válida

    dataRows.push({
      conta,
      historico,
      valor,
      data,
    })
  }

  return dataRows
}

/**
 * Agrupa participações por CONTA -> mês
 */
export function agruparParticipacoes(rows: ParticipacaoRow[], year: string): Map<string, ParticipacaoAgrupada> {
  const agrupadas = new Map<string, ParticipacaoAgrupada>()

  for (const row of rows) {
    // Filtrar por ano
    if (!row.data.startsWith(year)) continue

    const conta = row.conta || 'Sem Conta'

    if (!agrupadas.has(conta)) {
      agrupadas.set(conta, {
        conta,
        valoresPorMes: {},
        lancamentos: [],
      })
    }

    const contaData = agrupadas.get(conta)!

    // Adicionar lançamento
    contaData.lancamentos.push({
      historico: row.historico || '',
      valor: row.valor,
      data: row.data,
      conta: row.conta || '',
    })

    // Acumular valores por mês
    const mes = row.data
    contaData.valoresPorMes[mes] = (contaData.valoresPorMes[mes] || 0) + row.valor
  }

  return agrupadas
}
