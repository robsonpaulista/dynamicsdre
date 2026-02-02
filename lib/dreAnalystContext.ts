import type { DRERowData } from '@/types/dre'
import { PLANO_CONTAS } from '@/lib/planoContas'

/** Valor por linha da DRE em um mês (cod 1..13). */
export interface DREValuesForSheet {
  receitaBruta: number
  devolucoes: number
  bonificacoes: number
  tributos: number
  receitaLiquida: number
  cmv: number
  lucroBruto: number
  despesas: number
  resultadoOperacional: number
  imposto: number
  saldo: number
  participacoes: number
  resultadoLiquido: number
}

function getValorByCod(items: DRERowData[], cod: string, sheet: string): number {
  const item = items.find((i) => i.codPlanoconta === cod)
  return item?.valuesBySheet?.[sheet] ?? 0
}

/**
 * Retorna os valores da DRE para um mês (sheet). Receita Líquida/Lucro Bruto/etc. vêm da linha correspondente.
 */
export function getDREValuesForSheet(items: DRERowData[], sheet: string): DREValuesForSheet {
  const receitaBruta = getValorByCod(items, '1', sheet)
  const devolucoes = getValorByCod(items, '2', sheet)
  const bonificacoes = getValorByCod(items, '3', sheet)
  const tributos = getValorByCod(items, '4', sheet)
  const receitaLiquida = getValorByCod(items, '5', sheet)
  const cmv = getValorByCod(items, '6', sheet)
  const lucroBruto = getValorByCod(items, '7', sheet)
  const despesas = getValorByCod(items, '8', sheet)
  const resultadoOperacional = getValorByCod(items, '9', sheet)
  const imposto = getValorByCod(items, '10', sheet)
  const saldo = getValorByCod(items, '11', sheet)
  const participacoes = getValorByCod(items, '12', sheet)
  const resultadoLiquido = getValorByCod(items, '13', sheet)
  return {
    receitaBruta,
    devolucoes,
    bonificacoes,
    tributos,
    receitaLiquida,
    cmv,
    lucroBruto,
    despesas,
    resultadoOperacional,
    imposto,
    saldo,
    participacoes,
    resultadoLiquido,
  }
}

/**
 * Retorna a média do CMV como % da Receita Bruta (ex.: 70 = 70%).
 * Calcula a média dos percentuais mês a mês, não o percentual das médias.
 */
export function getCMVPercentOfReceitaBrutaAverage(items: DRERowData[], sheets: string[]): number | null {
  if (sheets.length === 0) return null
  const percentuais: number[] = []
  for (const sheet of sheets) {
    const v = getDREValuesForSheet(items, sheet)
    const recBruta = v.receitaBruta
    if (recBruta > 0) {
      const cmvAbs = Math.abs(v.cmv)
      percentuais.push((cmvAbs / recBruta) * 100)
    }
  }
  if (percentuais.length === 0) return null
  return percentuais.reduce((a, b) => a + b, 0) / percentuais.length
}

/**
 * Retorna o CMV como % da Receita Bruta para um mês específico.
 */
export function getCMVPercentOfReceitaBruta(items: DRERowData[], sheet: string): number | null {
  const v = getDREValuesForSheet(items, sheet)
  if (v.receitaBruta <= 0) return null
  return (Math.abs(v.cmv) / v.receitaBruta) * 100
}

/**
 * Retorna os valores médios da DRE em todo o período (média de cada plano de contas em todos os sheets).
 */
export function getDREValuesAverage(items: DRERowData[], sheets: string[]): DREValuesForSheet {
  if (sheets.length === 0) {
    return {
      receitaBruta: 0,
      devolucoes: 0,
      bonificacoes: 0,
      tributos: 0,
      receitaLiquida: 0,
      cmv: 0,
      lucroBruto: 0,
      despesas: 0,
      resultadoOperacional: 0,
      imposto: 0,
      saldo: 0,
      participacoes: 0,
      resultadoLiquido: 0,
    }
  }
  const sum: DREValuesForSheet = {
    receitaBruta: 0,
    devolucoes: 0,
    bonificacoes: 0,
    tributos: 0,
    receitaLiquida: 0,
    cmv: 0,
    lucroBruto: 0,
    despesas: 0,
    resultadoOperacional: 0,
    imposto: 0,
    saldo: 0,
    participacoes: 0,
    resultadoLiquido: 0,
  }
  for (const sheet of sheets) {
    const v = getDREValuesForSheet(items, sheet)
    sum.receitaBruta += v.receitaBruta
    sum.devolucoes += v.devolucoes
    sum.bonificacoes += v.bonificacoes
    sum.tributos += v.tributos
    sum.receitaLiquida += v.receitaLiquida
    sum.cmv += v.cmv
    sum.lucroBruto += v.lucroBruto
    sum.despesas += v.despesas
    sum.resultadoOperacional += v.resultadoOperacional
    sum.imposto += v.imposto
    sum.saldo += v.saldo
    sum.participacoes += v.participacoes
    sum.resultadoLiquido += v.resultadoLiquido
  }
  const n = sheets.length
  return {
    receitaBruta: sum.receitaBruta / n,
    devolucoes: sum.devolucoes / n,
    bonificacoes: sum.bonificacoes / n,
    tributos: sum.tributos / n,
    receitaLiquida: sum.receitaLiquida / n,
    cmv: sum.cmv / n,
    lucroBruto: sum.lucroBruto / n,
    despesas: sum.despesas / n,
    resultadoOperacional: sum.resultadoOperacional / n,
    imposto: sum.imposto / n,
    saldo: sum.saldo / n,
    participacoes: sum.participacoes / n,
    resultadoLiquido: sum.resultadoLiquido / n,
  }
}

/**
 * Conta reversa: queremos targetRL, temos os demais valores, achamos o valor da incógnita que refaz a conta.
 * Na DRE: RL = RecLiq + CMV + Desp + Imp + Part (soma dos valores das células; CMV, Desp, Imp, Part costumam vir negativos).
 * CMV percentual: quando cmvPercent é informado, CMV = RecBruta * (cmvPercent/100) em valor (negativo como custo).
 */
export function computeTargetsForResultadoLiquido(
  values: DREValuesForSheet,
  targetRL: number,
  cmvPercent?: number | null
): {
  receitaBrutaMinima: number
  cmvMaximo: number
  despesasMaximas: number
  cmvCalculadoRaw: number
  despesasCalculadoRaw: number
  cmvPercentUsado: number | null
} {
  const cmvPercentUsado = cmvPercent != null && cmvPercent >= 0 && cmvPercent < 100 ? cmvPercent : null

  // Conta reversa: RL = RecLiq + CMV + Desp + Imp + Part
  const cmvCalculadoRaw = targetRL - values.receitaLiquida - values.despesas - values.imposto - values.participacoes
  const cmvMaximo = cmvCalculadoRaw

  // Desp = targetRL - RecLiq - CMV - Imp - Part
  const despesasCalculadoRaw = targetRL - values.receitaLiquida - values.cmv - values.imposto - values.participacoes
  const despesasMaximas = despesasCalculadoRaw

  // Receita: quando CMV é % da Receita Bruta: RecBruta*(1 - cmvPct/100) + deducoes + desp + imp + part = targetRL
  let receitaBrutaMinima: number
  if (cmvPercentUsado != null) {
    const deducoes = values.devolucoes + values.bonificacoes + values.tributos
    const numerador = targetRL - deducoes - values.despesas - values.imposto - values.participacoes
    const denominador = 1 - cmvPercentUsado / 100
    receitaBrutaMinima = denominador > 0 ? Math.max(0, numerador / denominador) : 0
  } else {
    const receitaLiquidaMinima = targetRL - values.cmv - values.despesas - values.imposto - values.participacoes
    const deducoesAbs = Math.abs(values.devolucoes) + Math.abs(values.bonificacoes) + Math.abs(values.tributos)
    receitaBrutaMinima = Math.max(0, receitaLiquidaMinima + deducoesAbs)
  }

  return {
    receitaBrutaMinima,
    cmvMaximo,
    despesasMaximas,
    cmvCalculadoRaw,
    despesasCalculadoRaw,
    cmvPercentUsado,
  }
}

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
 * @param expenseFilter - Se definido, inclui apenas o grupo de despesas com nome que contenha este texto (case-insensitive).
 */
export function buildDREContextForAgent(
  items: DRERowData[],
  sheets: string[],
  year: number,
  maxLength?: number,
  expenseFilter?: string
): string {
  const linhas: string[] = []
  const meses = sheets.map(formatMonth).join(', ')
  linhas.push(`DRE ${year} | Meses: ${meses}`)
  linhas.push('')

  const filterLower = expenseFilter?.toLowerCase().trim()

  // Valores por plano (nível raiz): por mês, acumulado (soma do ano) e média do ano
  const avgValues = getDREValuesAverage(items, sheets)
  const avgByCod: Record<string, number> = {
    '1': avgValues.receitaBruta,
    '2': avgValues.devolucoes,
    '3': avgValues.bonificacoes,
    '4': avgValues.tributos,
    '5': avgValues.receitaLiquida,
    '6': avgValues.cmv,
    '7': avgValues.lucroBruto,
    '8': avgValues.despesas,
    '9': avgValues.resultadoOperacional,
    '10': avgValues.imposto,
    '11': avgValues.saldo,
    '12': avgValues.participacoes,
    '13': avgValues.resultadoLiquido,
  }
  linhas.push('IMPORTANTE: Quando o usuário NÃO informar um mês específico, use a MÉDIA do ano (não os máximos de cada item).')
  linhas.push('')
  for (const item of items) {
    if (!item.valuesBySheet) continue
    const vals = sheets.map((m) => formatValor(item.valuesBySheet[m] ?? 0)).join('; ')
    const acum = sheets.reduce((s, m) => s + (item.valuesBySheet[m] ?? 0), 0)
    const media = avgByCod[item.codPlanoconta] ?? (sheets.length > 0 ? acum / sheets.length : 0)
    linhas.push(`${item.codPlanoconta} ${shortLabel(item.plano)}: ${vals} | Acum: R$ ${formatValor(acum)} | Média/ano: R$ ${formatValor(media)}`)
    // Hierarquia grupo -> conta (compacta, máx. 6 grupos e 5 contas por grupo)
    if (item.children && item.children.length > 0) {
      const maxGrupos = 6
      const maxContasPorGrupo = 5
      const isDespesas = item.codPlanoconta === '8'
      const grupos = filterLower && isDespesas
        ? item.children.filter((g) => g.plano.toLowerCase().includes(filterLower))
        : item.children.slice(0, maxGrupos)
      for (const grupo of grupos.slice(0, maxGrupos)) {
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

/** Retorna valor de referência por código (1..13) e se é linha de dedução (exibir em módulo). */
function getValorRefByCod(
  values: DREValuesForSheet,
  cod: string
): number {
  const map: Record<string, number> = {
    '1': values.receitaBruta,
    '2': values.devolucoes,
    '3': values.bonificacoes,
    '4': values.tributos,
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
  const v = map[cod] ?? 0
  return [2, 3, 4, 6, 8, 10, 12].includes(parseInt(cod, 10)) ? Math.abs(v) : v
}

/**
 * Recalcula todos os saldos (=) da DRE a partir do valor calculado (receita, CMV ou despesas).
 * Quando askedMetric=receita e cmvPercent está definido, CMV = RecBruta * (cmvPercent/100) como custo (negativo).
 */
function computeFullTargetChain(
  values: DREValuesForSheet,
  targets: ReturnType<typeof computeTargetsForResultadoLiquido>,
  targetRL: number,
  askedMetric: 'receita' | 'cmv' | 'despesas'
): Record<string, number> {
  let recBruta: number
  let cmv: number
  let despesas: number

  if (askedMetric === 'receita') {
    recBruta = targets.receitaBrutaMinima
    if (targets.cmvPercentUsado != null) {
      cmv = -(targets.cmvPercentUsado / 100) * recBruta
    } else {
      cmv = values.cmv
    }
    despesas = values.despesas
  } else if (askedMetric === 'cmv') {
    recBruta = values.receitaBruta
    cmv = targets.cmvMaximo
    despesas = values.despesas
  } else {
    recBruta = values.receitaBruta
    cmv = values.cmv
    despesas = targets.despesasMaximas
  }

  const devol = values.devolucoes
  const bonif = values.bonificacoes
  const trib = values.tributos
  const imposto = values.imposto
  const participacoes = values.participacoes

  const recLiq = recBruta + devol + bonif + trib
  const lucroBruto = recLiq + cmv
  const resOper = lucroBruto + despesas
  const saldo = resOper + imposto
  const rl = saldo + participacoes

  return {
    '1': recBruta,
    '2': devol,
    '3': bonif,
    '4': trib,
    '5': recLiq,
    '6': cmv,
    '7': lucroBruto,
    '8': despesas,
    '9': resOper,
    '10': imposto,
    '11': saldo,
    '12': participacoes,
    '13': targetRL,
  }
}

/**
 * Monta o bloco "Metas (Resultado Líquido alvo = X)" com quadro na mesma estrutura e ordem da DRE.
 * Todos os saldos (=) são recalculados para que a conta feche e o usuário veja o fluxo completo.
 */
export function buildTargetResultadoLiquidoSection(
  items: DRERowData[],
  sheets: string[],
  targetRL: number,
  referenceSheet: string | null,
  askedMetric: 'receita' | 'cmv' | 'despesas'
): string {
  if (sheets.length === 0) return ''
  const useAverage = referenceSheet == null
  const values = useAverage
    ? getDREValuesAverage(items, sheets)
    : getDREValuesForSheet(items, referenceSheet)
  const cmvPercent =
    askedMetric === 'receita'
      ? useAverage
        ? getCMVPercentOfReceitaBrutaAverage(items, sheets)
        : getCMVPercentOfReceitaBruta(items, referenceSheet)
      : null
  const targets = computeTargetsForResultadoLiquido(values, targetRL, cmvPercent)
  const chain = computeFullTargetChain(values, targets, targetRL, askedMetric)
  const refLabel = useAverage
    ? `Média mensal do ano (${formatMonth(sheets[0])} a ${formatMonth(sheets[sheets.length - 1])}) — NÃO usar máximos`
    : formatMonth(referenceSheet)
  const linhas: string[] = []
  linhas.push('')
  linhas.push('---')
  linhas.push(`Metas (Resultado Líquido alvo = R$ ${formatValor(targetRL)} | referência: ${refLabel})`)
  if (targets.cmvPercentUsado != null) {
    linhas.push(`CMV aplicado como ${targets.cmvPercentUsado.toFixed(1)}% da Receita Bruta${useAverage ? ' (média do período)' : ''}.`)
  }
  linhas.push('')
  linhas.push('Quadro com todos os saldos (=) recalculados para a conta fechar:')
  linhas.push('')
  linhas.push('| Item | Valor |')
  linhas.push('|------|-------|')

  const subtotalCodigos = new Set(['5', '7', '9', '11', '13'])

  for (const { codPlanoconta, plano } of PLANO_CONTAS) {
    const cod = codPlanoconta
    const valor = chain[cod] ?? 0
    const vAbs = [2, 3, 4, 6, 8, 10, 12].includes(parseInt(cod, 10)) ? Math.abs(valor) : valor
    const valorFormatado = `R$ ${formatValor(vAbs)}`
    let valorCell: string
    if (cod === '1' && askedMetric === 'receita') {
      valorCell = `**${valorFormatado}** *(mín. para meta)*`
    } else if (cod === '6' && askedMetric === 'receita' && targets.cmvPercentUsado != null) {
      valorCell = `**${valorFormatado}** *(${targets.cmvPercentUsado.toFixed(1)}% da Rec. Bruta)*`
    } else if (cod === '6' && askedMetric === 'cmv') {
      const nota =
        targets.cmvCalculadoRaw <= 0
          ? ' *(meta não atingível)*'
          : ' *(máx. para meta)*'
      valorCell = `**${valorFormatado}**${nota}`
    } else if (cod === '8' && askedMetric === 'despesas') {
      const nota =
        targets.despesasCalculadoRaw <= 0
          ? ' *(meta não atingível)*'
          : ' *(máx. para meta)*'
      valorCell = `**${valorFormatado}**${nota}`
    } else if (cod === '13') {
      valorCell = `**${valorFormatado}** *(meta)*`
    } else if (subtotalCodigos.has(cod)) {
      valorCell = `**${valorFormatado}**`
    } else {
      valorCell = valorFormatado
    }
    linhas.push(`| ${plano} | ${valorCell} |`)
  }
  return linhas.join('\n')
}
