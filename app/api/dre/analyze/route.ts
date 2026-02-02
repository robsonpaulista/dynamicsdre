import { NextRequest, NextResponse } from 'next/server'
import {
  buildDREContextForAgent,
  buildTargetResultadoLiquidoSection,
  getDREValuesForSheet,
} from '@/lib/dreAnalystContext'
import type { DRERowData } from '@/types/dre'

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'
/** Limite de contexto (Groq free tier tem TPM limitado). Aumente via GROQ_MAX_CONTEXT se tiver plano pago. */
const MAX_CONTEXT_CHARS = Number(process.env.GROQ_MAX_CONTEXT) || 6_500

/** Normaliza número pt-BR (1.000,50 ou 100.000) para número. */
function parseBrazilianNumber(s: string): number {
  const t = s.trim().replace(/\s/g, '')
  if (t.includes(',')) {
    const [intPart, decPart] = t.split(',')
    const intVal = intPart.replace(/\./g, '')
    const decVal = (decPart ?? '').slice(0, 2).padEnd(2, '0')
    return parseInt(intVal, 10) + parseInt(decVal, 10) / Math.pow(10, decVal.length)
  }
  return parseFloat(t.replace(/\./g, '')) || 0
}

/**
 * Extrai valor alvo de Resultado Líquido da pergunta (ex.: "resultado líquido >= 100.000", "para ter RL de 50 mil").
 */
function parseTargetResultadoLiquido(query: string): number | null {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  const hasTarget =
    /resultado\s*l[ií]quido|rl\s*(>=|=>|de|=\s*)|atingir\s*(um?\s*)?resultado|faturamento|receita\s*para\s*ter|quanto\s+deve\s+ser/.test(
      normalized
    )
  if (!hasTarget) return null
  // ">= 100.000", "de 50.000", "de 50 mil", "= 100000"
  const withNum = normalized.match(
    /(?:resultado\s*l[ií]quido|rl)\s*(?:>=|=>|de|=\s*)?\s*([\d.,]+)\s*(mil|milh[oõ]es?)?/i
  )
  if (withNum) {
    let n = parseBrazilianNumber(withNum[1])
    if (withNum[2]) {
      if (/mil\b/i.test(withNum[2])) n *= 1000
      else if (/milh/i.test(withNum[2])) n *= 1_000_000
    }
    return n >= 0 ? n : null
  }
  if (/igual\s+a\s+zero|=\s*0|zero\b/.test(normalized) && /resultado\s*l[ií]quido|rl\b/.test(normalized)) {
    return 0
  }
  const genericNum = normalized.match(/([\d.,]+)\s*(mil|milh[oõ]es?)?(?=\s*(?:\.|$|e\s+|\?|para))/i)
  if (genericNum && /quanto|receita|faturamento|cmv|despesas|atingir|resultado/.test(normalized)) {
    let n = parseBrazilianNumber(genericNum[1])
    if (genericNum[2]) {
      if (/mil\b/i.test(genericNum[2])) n *= 1000
      else if (/milh/i.test(genericNum[2])) n *= 1_000_000
    }
    return n >= 0 ? n : null
  }
  return null
}

/**
 * Detecta sobre qual métrica o usuário está perguntando para atingir Resultado Líquido:
 * receita/faturamento -> só calcular Receita Bruta mínima; cmv -> só CMV máximo; despesas -> só Despesas máximas.
 */
function getTargetMetricFromQuery(query: string): 'receita' | 'cmv' | 'despesas' | null {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  if (/\b(receita|faturamento|receita\s+operacional\s+bruta)\b/.test(normalized)) return 'receita'
  if (/\b(cmv|custo\s+da\s+mercadoria|custo\s+mercadoria|última\s+entrada)\b/.test(normalized)) return 'cmv'
  if (/\b(despesas?|despesas?\s+fixas|despesas?\s+vari[aá]veis)\b/.test(normalized)) return 'despesas'
  return null
}

/**
 * Extrai mês da pergunta (ex.: "em dezembro", "dez/2025", "mês 12").
 * Retorna o sheet (YYYY-MM) correspondente ou null se não informado (usa média do período).
 */
function parseMonthFromQuery(query: string, sheets: string[]): string | null {
  if (sheets.length === 0) return null
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  const yearFromSheets = sheets[0].startsWith('20') ? sheets[0].slice(0, 4) : String(new Date().getFullYear())
  const meses: Record<string, string> = {
    janeiro: '01',
    jan: '01',
    fevereiro: '02',
    fev: '02',
    março: '03',
    marco: '03',
    mar: '03',
    abril: '04',
    abr: '04',
    maio: '05',
    mai: '05',
    junho: '06',
    jun: '06',
    julho: '07',
    jul: '07',
    agosto: '08',
    ago: '08',
    setembro: '09',
    set: '09',
    outubro: '10',
    out: '10',
    novembro: '11',
    nov: '11',
    dezembro: '12',
    dez: '12',
  }
  for (const [nome, mm] of Object.entries(meses)) {
    if (new RegExp(`\\b(em\\s+)?${nome}\\b`).test(normalized)) {
      const sheet = `${yearFromSheets}-${mm}`
      if (sheets.includes(sheet)) return sheet
      return null
    }
  }
  const mesNum = normalized.match(/\bm[eê]s\s*(\d{1,2})\b|(\d{1,2})\s*\/\s*(\d{4})|(\d{4})\s*-\s*(\d{1,2})\b/)
  if (mesNum) {
    const mm = (mesNum[1] ?? mesNum[2] ?? mesNum[5] ?? '').padStart(2, '0')
    const yy = mesNum[3] ?? mesNum[4] ?? yearFromSheets
    const sheet = yy.length === 4 ? `${yy}-${mm}` : `${yearFromSheets}-${mm}`
    if (sheets.includes(sheet)) return sheet
  }
  return null
}

/** Formata sheet (YYYY-MM) para label de mês (ex.: "Jan/2025"). */
function formatMonthLabel(sheet: string): string {
  const [, m] = sheet.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const i = parseInt(m ?? '01', 10) - 1
  return i >= 0 && i < 12 ? `${names[i]}/${sheet.slice(0, 4)}` : sheet
}

/** Mapa de palavras-chave para métricas da DRE (evolução ao longo dos meses). */
const EVOLUTION_METRIC_MAP: Array<{ pattern: RegExp; codPlanoconta: string; label: string }> = [
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(receita\s+operacional\s+bruta|receita\s+bruta|faturamento)\b/i, codPlanoconta: '1', label: 'Receita Operacional Bruta' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(receita\s+operacional\s+l[ií]quida|receita\s+l[ií]quida|rol)\b/i, codPlanoconta: '5', label: 'Receita Operacional Líquida' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(cmv|custo\s+(da\s+)?mercadoria)\b/i, codPlanoconta: '6', label: 'CMV' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(lucro\s+bruto|margem\s+bruta)\b/i, codPlanoconta: '7', label: 'Lucro Bruto' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(despesas?)\b/i, codPlanoconta: '8', label: 'Despesas' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(resultado\s+operacional|res\.?\s*operacional)\b/i, codPlanoconta: '9', label: 'Resultado Operacional' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(imposto)\b/i, codPlanoconta: '10', label: 'Imposto' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(saldo)\b/i, codPlanoconta: '11', label: 'Saldo' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(participa[cç][oõ]es)\b/i, codPlanoconta: '12', label: 'Participações' },
  { pattern: /\b(evolu[cç][aã]o\s+(da|do|de)?\s*)?(resultado\s+l[ií]quido|rl)\b/i, codPlanoconta: '13', label: 'Resultado Líquido' },
]

/**
 * Detecta se a pergunta é sobre evolução de métricas ao longo dos meses.
 * Retorna array de { codPlanoconta, label } para as métricas mencionadas.
 */
function parseEvolutionMetrics(query: string): Array<{ codPlanoconta: string; label: string }> {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  const hasEvolution = /\bevolu[cç][aã]o\b|ao\s+longo\s+dos\s+meses|evoluir|evolu[ií](ram|u)|compare\s+(a\s+)?evolu[cç][aã]o|evolu[cç][aã]o\s+(da|do|de)|evoluiu/i.test(normalized)
  if (!hasEvolution) return []
  const found: Array<{ codPlanoconta: string; label: string }> = []
  const seen = new Set<string>()
  for (const { pattern, codPlanoconta, label } of EVOLUTION_METRIC_MAP) {
    if (pattern.test(query) && !seen.has(codPlanoconta)) {
      seen.add(codPlanoconta)
      found.push({ codPlanoconta, label })
    }
  }
  return found
}

/** Monta dados para gráfico de evolução: { month, ...metricValues }. */
function buildEvolutionChartData(
  items: DRERowData[],
  sheets: string[],
  metrics: Array<{ codPlanoconta: string; label: string }>
): Array<Record<string, string | number>> | null {
  if (metrics.length === 0 || sheets.length === 0) return null
  const dataKeyMap: Record<string, string> = {}
  for (const m of metrics) {
    dataKeyMap[m.codPlanoconta] = m.label
  }
  const result: Array<Record<string, string | number>> = []
  for (const sheet of sheets) {
    const row: Record<string, string | number> = { month: formatMonthLabel(sheet) }
    const values = getDREValuesForSheet(items, sheet)
    const valueByCod: Record<string, number> = {
      '1': values.receitaBruta,
      '5': values.receitaLiquida,
      '6': values.cmv,
      '7': values.lucroBruto,
      '8': values.despesas,
      '9': values.resultadoOperacional,
      '10': values.imposto,
      '11': values.saldo,
      '12': values.participacoes,
      '13': values.resultadoLiquido,
    }
    for (const m of metrics) {
      const v = valueByCod[m.codPlanoconta] ?? 0
      row[m.label] = Math.abs(v)
    }
    result.push(row)
  }
  return result
}

/**
 * Extrai "últimos N meses" da pergunta (ex.: "últimos 3 meses", "nos últimos 6 meses").
 * Retorna N ou null se não mencionado. Usado para filtrar sheets e garantir contexto temporal correto.
 */
function parseUltimosMeses(query: string): number | null {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  const match = normalized.match(/\b(?:nos?\s+)?(?:últimos?|ultimos?|ultimas?|últimas?)\s+(\d+)\s+meses?\b/i)
  if (match) {
    const n = parseInt(match[1], 10)
    return n > 0 && n <= 24 ? n : null
  }
  return null
}

/** Extrai percentual mínimo da pergunta (ex.: "variação de 10%" → 10). */
function parseVariationThreshold(query: string): number | null {
  const normalized = query.toLowerCase().replace(/\s+/g, ' ')
  if (!/varia[cç]ao|variar|variaram/.test(normalized)) return null
  const match = normalized.match(/(?:de|mais\s+de|acima\s+de|superior\s+a)?\s*(\d+)\s*%?/)
  if (match) return Math.min(100, Math.max(0, parseInt(match[1], 10)))
  return 10
}

/** Coleta células de despesas (grupo + conta) com variação >= threshold. */
function computeVariationHighlights(
  items: DRERowData[],
  sheets: string[],
  thresholdPercent: number
): Array<{ codPlanoconta: string; mesAnterior: string; mesAtual: string; variacaoPercentual: number; valorAnterior: number; valorAtual: number }> {
  const highlights: Array<{ codPlanoconta: string; mesAnterior: string; mesAtual: string; variacaoPercentual: number; valorAnterior: number; valorAtual: number }> = []
  const despesas = items.find((i) => i.codPlanoconta === '8')
  if (!despesas?.children || sheets.length < 2) return highlights

  for (const grupo of despesas.children) {
    if (!grupo.children?.length) continue
    for (const conta of grupo.children) {
      const vs = conta.valuesBySheet
      if (!vs) continue
      for (let i = 1; i < sheets.length; i++) {
        const mesAnterior = sheets[i - 1]
        const mesAtual = sheets[i]
        const valorAnterior = vs[mesAnterior] ?? 0
        const valorAtual = vs[mesAtual] ?? 0
        const den = Math.abs(valorAnterior)
        const variacao =
          den !== 0
            ? ((valorAtual - valorAnterior) / den) * 100
            : valorAtual !== 0
              ? 100
              : 0
        if (Math.abs(variacao) >= thresholdPercent) {
          highlights.push({
            codPlanoconta: conta.codPlanoconta,
            mesAnterior,
            mesAtual,
            variacaoPercentual: Math.round(variacao * 100) / 100,
            valorAnterior,
            valorAtual,
          })
        }
      }
    }
  }
  return highlights
}

const systemPrompt = `Analista DRE. Resposta curta e objetiva.

ESTRUTURA DA DRE (respeite sempre): Resultado Líquido depende de TODOS estes itens na ordem: 1-Receita Bruta, 2-Devoluções, 3-Bonificações, 4-Tributos → 5-Receita Líquida; 6-CMV → 7-Lucro Bruto; 8-Despesas → 9-Resultado Operacional; 10-Imposto → 11-Saldo; 12-Participações → 13-Resultado Líquido. NUNCA diga que falta informação (CMV, Tributos, etc.) — todos os itens 1–13 estão no contexto.

Quando houver a seção "Metas (Resultado Líquido alvo = R$ ...)" no contexto: ela contém o quadro completo com TODOS os itens da DRE já calculados. USE esse quadro. Explique a resposta citando a estrutura: a Receita Bruta mínima considera Receita Líquida, CMV, Despesas, Imposto e Participações (todos os itens relevantes). Responda o que foi perguntado (receita, CMV ou despesas), mas deixe claro que o cálculo respeita toda a DRE.

IMPORTANTE — Período: Quando o usuário pedir "últimos N meses", os dados já foram filtrados. Use só esses meses. Sem mês específico: use a MÉDIA do ano (coluna "Média/ano"), nunca os máximos.

Variação de despesas: responda em 1–2 frases que os itens estão destacados na tabela.

Outras perguntas: responda breve com base no contexto. Português.`

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GROQ_API_KEY não configurada.',
          hint: 'Adicione GROQ_API_KEY no .env.local (chave gratuita em https://console.groq.com/).',
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { query, dreData, sheets, year, expenseFilter } = body as {
      query?: string
      dreData?: DRERowData[]
      sheets?: string[]
      year?: number
      expenseFilter?: string
    }

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Envie uma pergunta ou parâmetro de análise (campo "query").' },
        { status: 400 }
      )
    }

    if (!dreData || !Array.isArray(dreData) || dreData.length === 0 || !sheets || sheets.length === 0) {
      return NextResponse.json(
        { error: 'Dados da DRE não enviados ou vazios. Carregue a DRE na tela e tente novamente.' },
        { status: 400 }
      )
    }

    const ano = typeof year === 'number' ? year : new Date().getFullYear()
    const qTrim = query.trim()

    /** Filtrar sheets para "últimos N meses" — garante contexto temporal correto (ex.: últimos 3 = Out, Nov, Dez) */
    let sheetsToUse = sheets
    const ultimosN = parseUltimosMeses(qTrim)
    if (ultimosN != null && sheets.length > ultimosN) {
      sheetsToUse = sheets.slice(-ultimosN)
    }

    const threshold = parseVariationThreshold(qTrim)
    const evolutionMetrics = parseEvolutionMetrics(qTrim)
    const chartData = evolutionMetrics.length > 0
      ? buildEvolutionChartData(dreData, sheetsToUse, evolutionMetrics)
      : null
    const highlights =
      threshold !== null
        ? computeVariationHighlights(dreData, sheetsToUse, threshold)
        : []

    let context = buildDREContextForAgent(dreData, sheetsToUse, ano, MAX_CONTEXT_CHARS, expenseFilter || undefined)
    const targetRL = parseTargetResultadoLiquido(qTrim)
    let quadroResumidoSection = ''
    if (targetRL != null && targetRL >= 0) {
      const referenceSheet = parseMonthFromQuery(qTrim, sheets)
      const askedMetric = getTargetMetricFromQuery(qTrim) ?? 'receita'
      quadroResumidoSection = buildTargetResultadoLiquidoSection(dreData, sheets, targetRL, referenceSheet, askedMetric)
      context += quadroResumidoSection
    }

    const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL

    async function callGroq(): Promise<Response> {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      const response = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Contexto da DRE:\n\n${context}\n\n---\n${expenseFilter ? `Foco: o usuário está consultando especificamente as despesas do grupo "${expenseFilter}".\n\n` : ''}Pergunta: ${qTrim}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    }

    let response = await callGroq()

    /** Retry automático 1x quando 429: aguarda os segundos indicados e reenvia */
    if (response.status === 429 && response.ok === false) {
      const errBody = await response.json().catch(() => ({}))
      const rawMsg = (errBody as { error?: { message?: string } })?.error?.message ?? ''
      const waitMatch = rawMsg.match(/try again in ([\d.]+)s/i)
      const waitSeconds = waitMatch ? Math.min(60, Math.ceil(parseFloat(waitMatch[1])) + 2) : 30
      await new Promise((r) => setTimeout(r, waitSeconds * 1000))
      response = await callGroq()
    }

    let analysis: string
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      const rawMsg = (errBody as { error?: { message?: string } })?.error?.message ?? response.statusText
      const isRateLimit = response.status === 429 || /rate limit|limite.*taxa/i.test(rawMsg)
      const waitMatch = rawMsg.match(/try again in ([\d.]+)s/i)
      const seconds = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) : null
      const friendlyError = isRateLimit
        ? seconds != null
          ? `Limite de uso da IA atingido. Aguarde cerca de ${seconds} segundos e tente novamente.`
          : 'Limite de uso da IA atingido. Aguarde alguns segundos e tente novamente.'
        : `Groq: ${rawMsg}`
      return NextResponse.json(
        { error: friendlyError },
        { status: response.status === 429 ? 429 : 502 }
      )
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (highlights.length > 0) {
      analysis =
        text ||
        `As despesas com variação de ${threshold}% ou mais no período estão destacadas na tabela. Passe o mouse no ícone de informação de cada valor para ver o percentual de variação mês a mês.`
    } else {
      analysis = text || 'Resposta vazia. Tente reformular a pergunta.'
    }

    return NextResponse.json({
      analysis,
      quadroResumido: quadroResumidoSection || undefined,
      highlights: highlights.length > 0 ? highlights : undefined,
      chartData: chartData ?? undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao analisar DRE'
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tempo esgotado. Tente uma pergunta mais objetiva.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: `Falha no analista: ${message}` },
      { status: 500 }
    )
  }
}
