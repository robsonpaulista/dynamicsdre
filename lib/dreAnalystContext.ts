import type { DRERowData } from '@/types/dre'

function formatValor(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

function formatMonth(month: string): string {
  const [y, m] = month.split('-')
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const i = parseInt(m, 10) - 1
  return i >= 0 && i < 12 ? `${names[i]}/${y}` : month
}

/** Variação mês a mês: { itemLabel, mesAnterior, mesAtual, valorAnterior, valorAtual, variacaoPercentual } */
export interface VariacaoItem {
  itemLabel: string
  codPlanoconta: string
  mesAnterior: string
  mesAtual: string
  valorAnterior: number
  valorAtual: number
  variacaoPercentual: number
}

/**
 * Coleta todas as variações mês a mês (em %) para cada plano de contas.
 */
export function calcularVariacoes(
  items: DRERowData[],
  sheets: string[]
): VariacaoItem[] {
  const variacoes: VariacaoItem[] = []
  for (const item of items) {
    if (!item.valuesBySheet || sheets.length < 2) continue
    for (let i = 1; i < sheets.length; i++) {
      const mesAnterior = sheets[i - 1]
      const mesAtual = sheets[i]
      const valorAnterior = item.valuesBySheet[mesAnterior] ?? 0
      const valorAtual = item.valuesBySheet[mesAtual] ?? 0
      const variacao =
        valorAnterior !== 0
          ? ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100
          : (valorAtual !== 0 ? 100 : 0)
      variacoes.push({
        itemLabel: item.plano,
        codPlanoconta: item.codPlanoconta,
        mesAnterior,
        mesAtual,
        valorAnterior,
        valorAtual,
        variacaoPercentual: Math.round(variacao * 100) / 100,
      })
    }
  }
  return variacoes
}

/** Abrevia nome do plano para economizar tokens. */
function shortLabel(plano: string): string {
  const map: Record<string, string> = {
    'Receita Operacional Bruta': 'Rec.Oper.Bruta',
    'Devoluções': 'Devol.',
    'Bonificações': 'Bonif.',
    'Tributos': 'Trib.',
    'Receita Líquida': 'Rec.Líq.',
    'CMV': 'CMV',
    'Lucro Bruto': 'Lucro Bruto',
    'Despesas': 'Despesas',
    'Resultado Operacional': 'Res.Oper.',
    'Imposto': 'Imposto',
    'Saldo': 'Saldo',
    'Participações': 'Particip.',
    'Resultado Líquido': 'Res.Líquido',
  }
  return map[plano] ?? plano.slice(0, 12)
}

/** Coleta todos os itens em árvore (raiz + filhos recursivos) para cálculo de variações. */
function flattenWithHierarchy(items: DRERowData[], prefix = ''): Array<{ item: DRERowData; grupo?: string }> {
  const out: Array<{ item: DRERowData; grupo?: string }> = []
  for (const item of items) {
    out.push({ item, grupo: prefix || undefined })
    if (item.children && item.children.length > 0) {
      const grupoNome = item.plano
      for (const child of item.children) {
        out.push({ item: child, grupo: grupoNome })
        // Não desce mais de um nível (grupo -> conta)
      }
    }
  }
  return out
}

/**
 * Monta um resumo textual da DRE para o agente de IA, com hierarquia grupo -> conta para despesas.
 * @param maxLength - Se definido, trunca o contexto para caber no limite de tokens do modelo (ex.: Groq 6k).
 */
export function buildDREContextForAgent(
  items: DRERowData[],
  sheets: string[],
  year: number,
  maxLength?: number
): string {
  const linhas: string[] = []
  const meses = sheets.map(formatMonth).join(', ')
  linhas.push(`DRE ${year} | Meses: ${meses}`)
  linhas.push('')

  // Valores por plano (nível raiz)
  for (const item of items) {
    if (!item.valuesBySheet) continue
    const vals = sheets.map((m) => formatValor(item.valuesBySheet[m] ?? 0)).join('; ')
    const acum = sheets.reduce((s, m) => s + (item.valuesBySheet[m] ?? 0), 0)
    linhas.push(`${item.codPlanoconta} ${shortLabel(item.plano)}: ${vals} | Acum: R$ ${formatValor(acum)}`)
    // Hierarquia grupo -> conta (compacta, máx. 6 grupos e 5 contas por grupo)
    if (item.children && item.children.length > 0) {
      const maxGrupos = 6
      const maxContasPorGrupo = 5
      for (const grupo of item.children.slice(0, maxGrupos)) {
        if (!grupo.valuesBySheet) continue
        const grupoVals = sheets.map((m) => formatValor(grupo.valuesBySheet![m] ?? 0)).join(';')
        linhas.push(`G: ${grupo.plano} | ${grupoVals}`)
        if (grupo.children && grupo.children.length > 0) {
          for (const conta of grupo.children.slice(0, maxContasPorGrupo)) {
            if (!conta.valuesBySheet) continue
            const variacoesConta: string[] = []
            for (let i = 1; i < sheets.length; i++) {
              const va = conta.valuesBySheet![sheets[i - 1]] ?? 0
              const vat = conta.valuesBySheet![sheets[i]] ?? 0
              const pct = va !== 0 ? (((vat - va) / Math.abs(va)) * 100) : (vat !== 0 ? 100 : 0)
              const r = Math.round(pct * 100) / 100
              if (Math.abs(r) >= 5) variacoesConta.push(`${formatMonth(sheets[i - 1]).slice(0, 3)}->${formatMonth(sheets[i]).slice(0, 3)} ${r > 0 ? '+' : ''}${r}%`)
            }
            const contaVals = sheets.map((m) => formatValor(conta.valuesBySheet![m] ?? 0)).join(';')
            linhas.push(`  C: ${conta.plano} | ${contaVals} | ${variacoesConta.join(' ')}`)
          }
          if (grupo.children.length > maxContasPorGrupo) {
            linhas.push(`  (+${grupo.children.length - maxContasPorGrupo} contas)`)
          }
        }
      }
      if (item.children.length > maxGrupos) {
        linhas.push(`(+${item.children.length - maxGrupos} grupos)`)
      }
      linhas.push('')
    }
  }

  const flat = flattenWithHierarchy(items)
  const variacoes = calcularVariacoes(flat.map((f) => f.item), sheets)
  const significativas = variacoes.filter(
    (v) => Math.abs(v.variacaoPercentual) >= 5 || v.valorAnterior === 0
  )
  linhas.push('Var% (mes ant):')
  const maxVarLinhas = 18
  for (const v of significativas.slice(0, maxVarLinhas)) {
    linhas.push(`  ${v.itemLabel}: ${formatMonth(v.mesAnterior)}->${formatMonth(v.mesAtual)} ${v.variacaoPercentual > 0 ? '+' : ''}${v.variacaoPercentual}%`)
  }
  if (significativas.length > maxVarLinhas) linhas.push(`  +${significativas.length - maxVarLinhas}`)
  linhas.push('R$ pt-BR. Resposta em tabelas Markdown por grupo.')

  let out = linhas.join('\n')
  if (typeof maxLength === 'number' && out.length > maxLength) {
    out = out.slice(0, maxLength - 60) + '\n[... truncado. Use os dados acima.]'
  }
  return out
}
