/**
 * Estrutura do Plano de Contas da DRE
 * Baseado na estrutura fornecida pelo usuário
 */
export interface PlanoContaItem {
  codPlanoconta: string
  plano: string
  subtotal: number
  codFormato: number
  level: number // Nível de hierarquia (0 = raiz, 1 = filho, etc.)
}

export const PLANO_CONTAS: PlanoContaItem[] = [
  { codPlanoconta: '1', plano: 'Receita Operacional Bruta', subtotal: 0, codFormato: 0, level: 0 },
  { codPlanoconta: '2', plano: '(-) Devoluções', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '3', plano: '(-) Bonificações', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '4', plano: '(-) Tributos', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '5', plano: '(=) Receita Operacional Líquida', subtotal: 1, codFormato: 0, level: 0 },
  { codPlanoconta: '6', plano: '(-) Cmv Última Entrada', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '7', plano: '(=) Lucro Bruto', subtotal: 1, codFormato: 0, level: 0 },
  { codPlanoconta: '8', plano: '(-) Despesas Fixas/Variáveis', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '9', plano: '(=) Resultado Operacional', subtotal: 1, codFormato: 0, level: 0 },
  { codPlanoconta: '10', plano: '(-) Imposto Sob Resultado', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '11', plano: '(=) Saldo', subtotal: 1, codFormato: 0, level: 0 },
  { codPlanoconta: '12', plano: '(-) Participações', subtotal: 0, codFormato: 0, level: 1 },
  { codPlanoconta: '13', plano: '(=) Resultado Líquido', subtotal: 1, codFormato: 0, level: 0 },
]

/**
 * Mapa rápido de CODPLANOCONTA -> PlanoContaItem
 */
export const PLANO_CONTAS_MAP = new Map<string, PlanoContaItem>(
  PLANO_CONTAS.map(item => [item.codPlanoconta, item])
)

/**
 * Obtém o item do plano de contas pelo código
 */
export function getPlanoConta(codPlanoconta: string): PlanoContaItem | undefined {
  return PLANO_CONTAS_MAP.get(codPlanoconta)
}
