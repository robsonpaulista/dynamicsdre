import { NextRequest, NextResponse } from 'next/server'
import { buildDREContextForAgent } from '@/lib/dreAnalystContext'
import type { DRERowData } from '@/types/dre'

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.1-8b-instant'
const MAX_CONTEXT_CHARS = 9_500

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

Quando o usuário perguntar sobre variação de despesas (ex.: "quais despesas variaram mais de X%"): responda em 1 ou 2 frases que os itens com variação acima do percentual pedido foram destacados na própria tabela da tela (com os grupos de despesas expandidos e as células com variação em destaque). O CEO pode passar o mouse no ícone de informação de cada valor para ver o percentual de variação mês a mês.

Para outras perguntas: responda de forma breve com base nos dados do contexto. Use só dados do contexto. Português.`

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
    const { query, dreData, sheets, year } = body as {
      query?: string
      dreData?: DRERowData[]
      sheets?: string[]
      year?: number
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
    const threshold = parseVariationThreshold(query.trim())
    const highlights =
      threshold !== null
        ? computeVariationHighlights(dreData, sheets, threshold)
        : []

    const context = buildDREContextForAgent(dreData, sheets, ano, MAX_CONTEXT_CHARS)
    const model = process.env.GROQ_MODEL ?? DEFAULT_MODEL

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

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
            content: `Contexto da DRE:\n\n${context}\n\n---\n\nPergunta: ${query.trim()}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    let analysis: string
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      const msg = (errBody as { error?: { message?: string } })?.error?.message ?? response.statusText
      return NextResponse.json(
        { error: `Groq: ${msg}` },
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
      highlights: highlights.length > 0 ? highlights : undefined,
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
