'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Bot, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { useIsDark } from '@/hooks/useIsDark'
import type { DRERowData, VariationHighlight } from '@/types/dre'

/** Dados para gráfico de evolução retornados pela API. */
type AnalystChartData = Array<Record<string, string | number>>

interface DREAnalystProps {
  dreData: DRERowData[]
  sheets: string[]
  year: number
  /** Filtro de despesa selecionado na página (ex.: "Aluguel") */
  expenseFilter?: string
  tableWrapperRef?: React.RefObject<HTMLDivElement | null>
  onHighlights?: (highlights: VariationHighlight[] | null) => void
  /** 'button' = botão com texto; 'icon' = só ícone (ex.: na navbar) */
  variant?: 'button' | 'icon'
}

/** Gráfico de linhas para evolução de métricas no Analista DRE. */
function AnalystEvolutionChart({ data, isDark }: { data: AnalystChartData; isDark: boolean }) {
  const textColor = isDark ? '#CBD5E1' : '#475569'
  const gridColor = isDark ? '#1F2937' : '#E5E7EB'
  const colors = ['#F97316', '#22C55E', '#3B82F6', '#A855F7', '#EC4899']
  const keys = data[0]
    ? (Object.keys(data[0]).filter((k) => k !== 'month') as string[])
    : []

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: Record<string, unknown> }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
            {String(payload[0]?.payload?.month ?? '')}
          </p>
          {payload.map((entry, i) => (
            <p key={i} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(Number(entry.value))}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="month"
          stroke={textColor}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke={textColor}
          style={{ fontSize: '12px' }}
          tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        {keys.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[i % colors.length], r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

const PERGUNTAS_PRESET = [
  'Quais despesas variaram mais de 10% (para cima ou para baixo) no período?',
  'Quais itens da DRE mais impactaram o resultado no último mês?',
  'Compare a evolução da Receita Operacional Bruta e do Lucro Bruto ao longo dos meses.',
  'Mostre as despesas nos últimos 3 meses.',
  'Quais despesas aumentaram em relação ao mês anterior? Liste com valor e %.',
  'Resuma os principais pontos de atenção da DRE neste período.',
]

const NUM_PARTICLES = 16
const COLLECTING_DURATION_MS = 2200

/** Wrapper do ícone do agente na navbar: destaque sutil com animação */
function AgentIconNavbar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full p-1.5 animate-agent-navbar-pulse',
        'bg-primary dark:bg-transparent',
        className
      )}
    >
      <Bot className="h-5 w-5 text-white" strokeWidth={2} />
    </span>
  )
}

export function DREAnalyst({ dreData, sheets, year, expenseFilter, tableWrapperRef, onHighlights, variant = 'button' }: DREAnalystProps) {
  const [open, setOpen] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [quadroResumido, setQuadroResumido] = useState<string | null>(null)
  const [chartData, setChartData] = useState<AnalystChartData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isDark = useIsDark()
  const [particleOrigins, setParticleOrigins] = useState<Array<{ x: number; y: number; dx: number; dy: number; delay: number }>>([])

  // Ao abrir o overlay do agente, calcular origens das partículas a partir da tabela
  useEffect(() => {
    if (!showAgent) {
      setParticleOrigins([])
      return
    }
    const agentX = window.innerWidth * 0.5
    const agentY = window.innerHeight * 0.5
    let rect: DOMRect
    if (tableWrapperRef?.current) {
      rect = tableWrapperRef.current.getBoundingClientRect()
    } else {
      // Fallback: zona central/inferior da tela (onde costuma estar a tabela)
      rect = new DOMRect(
        window.innerWidth * 0.1,
        window.innerHeight * 0.35,
        window.innerWidth * 0.8,
        window.innerHeight * 0.5
      )
    }
    const origins: Array<{ x: number; y: number; dx: number; dy: number; delay: number }> = []
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const x = rect.left + Math.random() * rect.width
      const y = rect.top + Math.random() * rect.height
      origins.push({
        x,
        y,
        dx: agentX - x,
        dy: agentY - y,
        delay: Math.random() * 0.4,
      })
    }
    setParticleOrigins(origins)
  }, [showAgent, tableWrapperRef])

  // Após a animação de coleta (só na primeira vez), abrir o modal
  useEffect(() => {
    if (!showAgent || open) return
    const t = setTimeout(() => {
      setShowAgent(false)
      setOpen(true)
    }, COLLECTING_DURATION_MS)
    return () => clearTimeout(t)
  }, [showAgent, open])

  const handleOpenAnalyst = () => {
    setQuery('')
    setAnalysis(null)
    setQuadroResumido(null)
    setChartData(null)
    setError(null)
    onHighlights?.(null)
    setShowAgent(true)
  }

  const handleAnalyze = async () => {
    const q = query.trim()
    if (!q) return
    const isAboutExpenses = /\bdespesa(s)?\b/i.test(q)
    if (isAboutExpenses) {
      setOpen(false)
      setShowAgent(true)
    }
    setLoading(true)
    setError(null)
    setAnalysis(null)
    setQuadroResumido(null)
    setChartData(null)
    try {
      const res = await fetch('/api/dre/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          dreData,
          sheets,
          year,
          expenseFilter: expenseFilter?.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao analisar')
        if (isAboutExpenses) setOpen(true)
        return
      }
      setAnalysis(data.analysis ?? '')
      setQuadroResumido((data as { quadroResumido?: string }).quadroResumido ?? null)
      setChartData((data as { chartData?: AnalystChartData }).chartData ?? null)
      onHighlights?.(data.highlights ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de conexão')
      if (isAboutExpenses) setOpen(true)
    } finally {
      setLoading(false)
      setShowAgent(false)
    }
  }

  const handlePreset = (text: string) => {
    setQuery(text)
    setError(null)
    setAnalysis(null)
    setChartData(null)
  }

  const canAnalyze = dreData.length > 0 && sheets.length > 0

  return (
    <>
      {variant === 'icon' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenAnalyst}
          aria-label="Analisar DRE com IA"
          title="Olá, sou a ANDRÉIA, sua agente inteligente de DRE"
          className="shrink-0 p-1 hover:bg-white/15"
        >
          <AgentIconNavbar />
        </Button>
      ) : (
        <div className="flex flex-col items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenAnalyst}
            className="gap-2"
          >
            <Bot className="h-4 w-4" />
            Analisar DRE com IA
          </Button>
          {error && !open && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Overlay: agente na tela + animação de puxar dados da tabela (acima do modal ao enviar pergunta) */}
      {showAgent && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[250] flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          {/* Fundo semi-transparente para manter a tabela visível */}
          <div className="absolute inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-[2px] pointer-events-auto" />

          {/* Partículas: “dados” fluindo da tabela em direção ao agente */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particleOrigins.map((p, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-primary dark:bg-dark-primary opacity-90"
                style={{
                  left: p.x,
                  top: p.y,
                  // @ts-expect-error CSS custom properties for keyframes
                  '--agent-dx': `${p.dx}px`,
                  '--agent-dy': `${p.dy}px`,
                  animation: `agent-pull-data 1.6s ease-in-out ${p.delay}s forwards`,
                }}
              />
            ))}
          </div>

          {/* Ícone do agente ANDREIA centralizado */}
          <div
            className={cn(
              'fixed left-1/2 top-1/2 z-10 flex flex-col items-center gap-3 pointer-events-none -translate-x-1/2 -translate-y-1/2',
              'animate-[agent-float_2s_ease-in-out_infinite]'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-20 h-20 rounded-full',
                'bg-primary/15 dark:bg-dark-primary/20 border-2 border-primary/40 dark:border-dark-primary/50',
                'animate-[agent-glow-pulse_2s_ease-in-out_infinite]'
              )}
            >
              <Bot className="w-10 h-10 text-primary dark:text-dark-primary" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-text-primary dark:text-dark-text-primary text-lg">
                ANDREIA
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">
                {loading ? 'Analisando sua pergunta…' : 'Coletando dados da tabela…'}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Analista DRE — Análise com IA"
        className="max-w-3xl max-h-[90vh]"
      >
        <div className="space-y-4">
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Faça perguntas sobre a DRE ou use parâmetros como: variações, despesas que subiram/desceram, comparações entre meses, etc.
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
              Sua pergunta ou parâmetro
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: Mostre as despesas nos últimos 3 meses | Quais despesas variaram mais de 10%?"
              className={cn(
                'w-full min-h-[100px] px-4 py-3 rounded-lg border bg-background dark:bg-dark-background',
                'border-border dark:border-dark-border',
                'text-text-primary dark:text-dark-text-primary placeholder:text-text-secondary dark:placeholder:text-dark-text-secondary',
                'focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary'
              )}
              rows={3}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
              Sugestões rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {PERGUNTAS_PRESET.map((text, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePreset(text)}
                  className={cn(
                    'text-left px-3 py-2 rounded-lg text-sm border transition-colors w-full min-w-0',
                    'border-border dark:border-dark-border',
                    'hover:bg-background-soft dark:hover:bg-dark-primary-surface',
                    'text-text-secondary dark:text-dark-text-secondary',
                    'whitespace-normal break-words'
                  )}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !query.trim() || !canAnalyze}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar análise
              </>
            )}
          </Button>

          {!canAnalyze && (
            <p className="text-sm text-warning">
              Carregue a DRE na tela antes de usar o analista.
            </p>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
              {error}
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              <div className="border border-border dark:border-dark-border rounded-lg p-4 bg-background-soft dark:bg-dark-primary-surface/30">
                <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">
                  Resposta do analista
                </p>
                <div className="analyst-markdown text-sm text-text-primary dark:text-dark-text-primary">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-lg border border-border dark:border-dark-border">
                          <table>{children}</table>
                        </div>
                      ),
                    }}
                  >
                    {analysis}
                  </ReactMarkdown>
                </div>
              </div>
              {chartData && chartData.length > 0 && (
                <div className="border border-border dark:border-dark-border rounded-lg p-4 bg-background-soft dark:bg-dark-primary-surface/30">
                  <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-3 uppercase tracking-wide">
                    Evolução ao longo dos meses
                  </p>
                  <AnalystEvolutionChart data={chartData} isDark={isDark} />
                </div>
              )}
            </div>
          )}

          {quadroResumido && (
            <div className="border border-border dark:border-dark-border rounded-lg p-4 bg-background-soft dark:bg-dark-primary-surface/30 mt-4">
              <p className="text-xs font-semibold text-text-secondary dark:text-dark-text-secondary mb-2 uppercase tracking-wide">
                Quadro resumido da meta
              </p>
              <div className="analyst-markdown text-sm text-text-primary dark:text-dark-text-primary">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-3 rounded-lg border border-border dark:border-dark-border">
                        <table className="w-full">{children}</table>
                      </div>
                    ),
                  }}
                >
                  {quadroResumido}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
