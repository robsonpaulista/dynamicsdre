'use client'

import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import type { DRERowData, VariationHighlight } from '@/types/dre'

interface DREAnalystProps {
  dreData: DRERowData[]
  sheets: string[]
  year: number
  tableWrapperRef?: React.RefObject<HTMLDivElement | null>
  onHighlights?: (highlights: VariationHighlight[] | null) => void
  /** 'button' = botão com texto; 'icon' = só ícone (ex.: na navbar) */
  variant?: 'button' | 'icon'
}

const PERGUNTAS_PRESET = [
  'Quais despesas variaram mais de 10% (para cima ou para baixo) no período?',
  'Quais itens da DRE mais impactaram o resultado no último mês?',
  'Compare a evolução da Receita Operacional Bruta e do Lucro Bruto ao longo dos meses.',
  'Quais despesas aumentaram em relação ao mês anterior? Liste com valor e %.',
  'Resuma os principais pontos de atenção da DRE neste período.',
]

const NUM_PARTICLES = 16
const COLLECTING_DURATION_MS = 2200

export function DREAnalyst({ dreData, sheets, year, tableWrapperRef, onHighlights, variant = 'button' }: DREAnalystProps) {
  const [open, setOpen] = useState(false)
  const [showAgent, setShowAgent] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [particleOrigins, setParticleOrigins] = useState<Array<{ x: number; y: number; dx: number; dy: number; delay: number }>>([])

  // Ao abrir o overlay do agente, calcular origens das partículas a partir da tabela
  useEffect(() => {
    if (!showAgent) {
      setParticleOrigins([])
      return
    }
    const agentX = window.innerWidth * 0.82
    const agentY = window.innerHeight * 0.48
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
    setError(null)
    onHighlights?.(null)
    setShowAgent(true)
  }

  const handleAnalyze = async () => {
    const q = query.trim()
    if (!q) return
    setOpen(false)
    setShowAgent(true)
    setLoading(true)
    setError(null)
    setAnalysis(null)
    try {
      const res = await fetch('/api/dre/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          dreData,
          sheets,
          year,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao analisar')
        return
      }
      setAnalysis(data.analysis ?? '')
      onHighlights?.(data.highlights ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro de conexão')
    } finally {
      setLoading(false)
      setShowAgent(false)
    }
  }

  const handlePreset = (text: string) => {
    setQuery(text)
    setError(null)
    setAnalysis(null)
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
          className="shrink-0"
        >
          <Bot className="h-5 w-5" />
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
      {showAgent && (
        <div
          className="fixed inset-0 z-[250] flex items-center justify-end pr-[18%] pointer-events-none"
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

          {/* Agente de IA */}
          <div
            className={cn(
              'relative z-10 flex flex-col items-center gap-3 pointer-events-none',
              'animate-[agent-float_2s_ease-in-out_infinite]'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-20 h-20 rounded-full',
                'bg-primary/20 dark:bg-dark-primary/30 border-2 border-primary dark:border-dark-primary',
                'animate-[agent-glow-pulse_2s_ease-in-out_infinite]'
              )}
            >
              <Bot className="w-10 h-10 text-primary dark:text-dark-primary" strokeWidth={2} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-text-primary dark:text-dark-text-primary text-lg">
                Agente DRE
              </p>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-0.5">
                {loading ? 'Analisando sua pergunta…' : 'Coletando dados da tabela…'}
              </p>
            </div>
          </div>
        </div>
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
              placeholder="Ex.: Quais despesas variaram mais de 10% para cima ou para baixo no período?"
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
                    'text-left px-3 py-2 rounded-lg text-sm border transition-colors',
                    'border-border dark:border-dark-border',
                    'hover:bg-background-soft dark:hover:bg-dark-primary-surface',
                    'text-text-secondary dark:text-dark-text-secondary'
                  )}
                >
                  {text.length > 50 ? text.slice(0, 50) + '…' : text}
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
          )}
        </div>
      </Modal>
    </>
  )
}
