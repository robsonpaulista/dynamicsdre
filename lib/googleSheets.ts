import { google } from 'googleapis'
import type { DREItemData } from '@/types/dre'

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
]

export interface GoogleSheetsConfig {
  spreadsheetId: string
  credentials: {
    client_email: string
    private_key: string
  }
}

export interface SheetRow {
  codPlanoconta: string
  plano: string
  subtotal: number
  codFormato: number
  valor?: number
  data?: string // Data da transação para agrupar por mês
  [key: string]: string | number | undefined
}

/**
 * Extrai o mês de uma data em vários formatos possíveis
 */
export function extractMonthFromDate(dateStr: string | number | undefined): string | null {
  if (!dateStr) return null
  
  try {
    let date: Date
    
    // Se for número (serial do Excel), converter
    if (typeof dateStr === 'number') {
      // Excel serial date: 1 = 1900-01-01
      date = new Date((dateStr - 25569) * 86400 * 1000)
    } else {
      // Tentar parsear como string
      const str = dateStr.toString().trim()
      
      // Formato americano com hora: M/D/YY H:MM (ex: "1/2/25 0:00")
      if (str.includes('/') && str.includes(' ')) {
        const [datePart] = str.split(' ')
        const parts = datePart.split('/')
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10)
          const day = parseInt(parts[1], 10)
          let year = parseInt(parts[2], 10)
          // Se ano tem 2 dígitos, assumir 2000+
          // Mas se for >= 25, pode ser 2025-2030, se for < 25, pode ser 2025+
          if (year < 100) {
            // Se ano é 25-30, assumir 2025-2030
            // Se ano é 0-24, assumir 2000-2024
            if (year >= 25 && year <= 30) {
              year = 2000 + year
            } else if (year >= 0 && year < 25) {
              year = 2000 + year
            } else {
              year = 2000 + year
            }
          }
          date = new Date(year, month - 1, day)
          
          // Validar data
          if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
            return null
          }
        } else {
          return null
        }
      }
      // Formato brasileiro: DD/MM/YYYY ou DD/MM/YY
      else if (str.includes('/')) {
        const parts = str.split('/')
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10)
          let year = parseInt(parts[2], 10)
          if (year < 100) {
            year = year + 2000
          }
          date = new Date(year, month - 1, day)
        } else {
          return null
        }
      } else {
        // Tentar parsear como ISO ou outros formatos
        date = new Date(str)
      }
    }
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return null
    }
    
    // Retornar no formato YYYY-MM
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  } catch (error) {
    return null
  }
}

export async function getSheetData(
  config: GoogleSheetsConfig,
  range: string
): Promise<string[][]> {
  const auth = new google.auth.JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: SCOPES,
  })
  
  const sheets = google.sheets({ version: 'v4', auth })
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range,
  })
  
  return response.data.values || []
}

export async function listSheetNames(config: GoogleSheetsConfig): Promise<string[]> {
  const auth = new google.auth.JWT({
    email: config.credentials.client_email,
    key: config.credentials.private_key,
    scopes: SCOPES,
  })
  
  const sheets = google.sheets({ version: 'v4', auth })
  
  const response = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
  })
  
  return response.data.sheets?.map((sheet) => sheet.properties?.title || '').filter(Boolean) || []
}

export function parseDREData(rows: string[][]): SheetRow[] {
  if (!rows || rows.length < 2) return []
  
  // Primeira linha são os cabeçalhos
  const headers = rows[0].map((h) => h.toString().trim())
  const headersLower = headers.map((h) => h.toLowerCase())
  
  // Encontrar índices das colunas (busca mais flexível)
  // Buscar exato primeiro, depois flexível
  let codIndex = headersLower.findIndex((h) => h === 'codplanoconta')
  if (codIndex === -1) {
    codIndex = headersLower.findIndex((h) => 
      h.includes('codplanoconta') || 
      h.includes('cod_planoconta')
    )
  }
  if (codIndex === -1) {
    codIndex = headersLower.findIndex((h) => 
      h.includes('cod') && !h.includes('formato') && !h.includes('conta') && !h.includes('usur') && !h.includes('filial')
    )
  }
  
  let planoIndex = headersLower.findIndex((h) => h === 'conta' || h === 'plano')
  if (planoIndex === -1) {
    planoIndex = headersLower.findIndex((h) => 
      (h.includes('plano') || h.includes('conta')) && !h.includes('cod')
    )
  }
  
  const subtotalIndex = headersLower.findIndex((h) => h.includes('subtotal'))
  const codFormatoIndex = headersLower.findIndex((h) => 
    h.includes('codformato') || 
    h.includes('cod_formato') ||
    h.includes('formato')
  )
  
  // Encontrar coluna de data
  // Priorizar DTEMISSAO (para devoluções), depois DATA (para faturamento)
  let dataIndex = headersLower.findIndex((h) => h === 'dtemissao')
  if (dataIndex === -1) {
    dataIndex = headersLower.findIndex((h) => h === 'data')
  }
  if (dataIndex === -1) {
    dataIndex = headersLower.findIndex((h) => 
      h.includes('dtemissao') ||
      h.includes('dataemissao') ||
      h.includes('data')
    )
  }
  if (dataIndex === -1) {
    dataIndex = headersLower.findIndex((h) => h.includes('dt') && !h.includes('cod'))
  }
  
  // Procurar coluna de valor - buscar por nomes conhecidos primeiro
  // Priorizar VLTOTAL (para devoluções), depois VALOR (para faturamento)
  let valorIndex = headersLower.findIndex((h) => h === 'vltotal')
  if (valorIndex === -1) {
    valorIndex = headersLower.findIndex((h) => h === 'valor')
  }
  if (valorIndex === -1) {
    valorIndex = headersLower.findIndex((h) => 
      h.includes('vltotal') ||
      h.includes('valor')
    )
  }
  if (valorIndex === -1) {
    valorIndex = headersLower.findIndex((h) => 
      h.includes('total') && !h.includes('subtotal')
    )
  }
  
  // Se não encontrou por nome, buscar a primeira coluna numérica que não seja COD, PLANO/CONTA, SUBTOTAL, CODFORMATO
  if (valorIndex === -1) {
    for (let j = 0; j < headers.length; j++) {
      const header = headersLower[j]
      if (
        j !== codIndex && 
        j !== planoIndex && 
        j !== subtotalIndex && 
        j !== codFormatoIndex &&
        !header.includes('cod') &&
        !header.includes('plano') &&
        !header.includes('conta') &&
        !header.includes('subtotal') &&
        !header.includes('formato') &&
        !header.includes('empresa') &&
        !header.includes('grupo') &&
        !header.includes('filial') &&
        !header.includes('data') &&
        !header.includes('dt') &&
        !header.includes('historico') &&
        !header.includes('desc') &&
        !header.includes('prod') &&
        !header.includes('qt') &&
        !header.includes('oper') &&
        !header.includes('recnum')
      ) {
        // Verificar se a primeira linha de dados tem um valor numérico nesta coluna
        if (rows.length > 1 && rows[1][j]) {
          const testVal = rows[1][j].toString().replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.')
          if (!isNaN(parseFloat(testVal)) && testVal !== '' && parseFloat(testVal) !== 0) {
            valorIndex = j
            break
          }
        }
      }
    }
  }
  
  if (codIndex === -1) {
    console.error('Cabeçalhos encontrados:', headers)
    throw new Error(`Estrutura da planilha inválida: coluna CODPLANOCONTA (índice ${codIndex}) não encontrada`)
  }
  
  // PLANO/CONTA não é obrigatório - pode estar vazia
  // if (planoIndex === -1) {
  //   console.error('Cabeçalhos encontrados:', headers)
  //   throw new Error(`Estrutura da planilha inválida: coluna PLANO/CONTA (índice ${planoIndex}) não encontrada`)
  // }
  
  // Processar linhas de dados
  const dataRows: SheetRow[] = []
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue
    
    const codPlanoconta = row[codIndex]?.toString().trim() || ''
    const plano = planoIndex >= 0 ? (row[planoIndex]?.toString().trim() || '') : ''
    
    // Pular linhas vazias (só precisa ter CODPLANOCONTA)
    // Mas também pular se CODPLANOCONTA for vazio ou não numérico
    if (!codPlanoconta || codPlanoconta === '') continue
    
    // Verificar se CODPLANOCONTA parece válido (tem pelo menos um número)
    if (!/\d/.test(codPlanoconta)) continue
    
    const subtotal = subtotalIndex >= 0 ? parseInt(row[subtotalIndex]?.toString() || '0', 10) : 0
    const codFormato = codFormatoIndex >= 0 ? parseInt(row[codFormatoIndex]?.toString() || '0', 10) : 0
    
    // Parsear valor
    let valor = 0
    if (valorIndex >= 0 && row[valorIndex]) {
      const valorStr = row[valorIndex].toString().trim()
      
      // Remover tudo exceto números, vírgula, ponto e sinal negativo
      const cleaned = valorStr.replace(/[^\d.,-]/g, '')
      
      // Se está vazio após limpeza, valor é 0
      if (!cleaned || cleaned === '' || cleaned === '-') {
        valor = 0
      } else {
        // Estratégia de parsing mais robusta:
        // 1. Se tem ponto E vírgula -> formato brasileiro (1.234,56)
        // 2. Se só tem vírgula -> verificar se é decimal ou milhar
        // 3. Se só tem ponto -> verificar se é decimal ou milhar
        // 4. Sem separadores -> número puro
        
        if (cleaned.includes('.') && cleaned.includes(',')) {
          // Formato brasileiro: ponto = milhar, vírgula = decimal
          // Ex: "1.234,56" -> 1234.56
          const brFormat = cleaned.replace(/\./g, '').replace(',', '.')
          valor = parseFloat(brFormat) || 0
        } else if (cleaned.includes(',')) {
          // Só vírgula: analisar contexto
          const parts = cleaned.split(',')
          const parteInteira = parts[0].replace(/-/g, '') // remover sinal para análise
          
          // Se parte inteira tem mais de 3 dígitos, provavelmente é milhar brasileiro sem ponto
          // Se tem 3 ou menos dígitos, provavelmente é decimal brasileiro
          if (parteInteira.length > 3) {
            // Milhar: remover vírgula (ex: "1234,56" -> 123456 - mas isso não faz sentido)
            // Na verdade, se tem vírgula e mais de 3 dígitos, pode ser formato misto
            // Vamos assumir que é decimal brasileiro mesmo
            valor = parseFloat(cleaned.replace(',', '.')) || 0
          } else {
            // Decimal brasileiro: trocar vírgula por ponto
            valor = parseFloat(cleaned.replace(',', '.')) || 0
          }
        } else if (cleaned.includes('.')) {
          // Só ponto: analisar se é decimal ou milhar
          const parts = cleaned.split('.')
          
          // Se tem exatamente 2 partes e a segunda tem 2 dígitos ou menos, é decimal americano
          // Ex: "1234.56" -> 1234.56 (decimal)
          // Ex: "1.234" -> pode ser milhar (1234) ou decimal (1.234)
          if (parts.length === 2) {
            // Se a parte decimal tem mais de 2 dígitos, provavelmente é milhar mal formatado
            // Mas vamos assumir que é decimal se tem até 5 dígitos na parte decimal
            if (parts[1].length <= 5) {
              // Decimal americano: usar direto
              valor = parseFloat(cleaned) || 0
            } else {
              // Provavelmente é milhar mal formatado, mas vamos tratar como decimal
              valor = parseFloat(cleaned) || 0
            }
          } else if (parts.length > 2) {
            // Múltiplos pontos: formato de milhar (ex: "1.234.567")
            valor = parseFloat(cleaned.replace(/\./g, '')) || 0
          } else {
            // Um ponto mas só uma parte? Usar direto
            valor = parseFloat(cleaned) || 0
          }
        } else {
          // Sem separadores: número puro
          valor = parseFloat(cleaned) || 0
        }
      }
      
      // Validar se o valor não é NaN ou Infinity
      if (isNaN(valor) || !isFinite(valor)) {
        valor = 0
      }
    }
    
    // Extrair data se disponível
    let data: string | undefined
    if (dataIndex >= 0 && row[dataIndex]) {
      const monthKey = extractMonthFromDate(row[dataIndex])
      if (monthKey) {
        data = monthKey
      }
    }
    
    // Só adicionar se tiver CODPLANOCONTA válido
    if (codPlanoconta && /\d/.test(codPlanoconta)) {
      dataRows.push({
        codPlanoconta,
        plano,
        subtotal,
        codFormato,
        valor,
        data,
      })
    }
  }
  
  return dataRows
}

function detectItemType(plano: string, codPlanoconta: string): 'revenue' | 'cost' | 'expense' | 'result' | undefined {
  const planoLower = plano.toLowerCase()
  const codLower = codPlanoconta.toLowerCase()
  
  // Receitas
  if (
    planoLower.includes('receita') ||
    planoLower.includes('venda') ||
    planoLower.includes('faturamento') ||
    codLower.startsWith('1')
  ) {
    return 'revenue'
  }
  
  // Custos
  if (
    planoLower.includes('custo') ||
    planoLower.includes('cmv') ||
    planoLower.includes('custo da mercadoria') ||
    codLower.startsWith('6')
  ) {
    return 'cost'
  }
  
  // Despesas
  if (
    planoLower.includes('despesa') ||
    planoLower.includes('gasto') ||
    planoLower.includes('despesa operacional') ||
    codLower.startsWith('8')
  ) {
    return 'expense'
  }
  
  // Resultados
  if (
    planoLower.includes('resultado') ||
    planoLower.includes('lucro') ||
    planoLower.includes('saldo') ||
    planoLower.includes('(=)') ||
    codLower.startsWith('7') ||
    codLower.startsWith('9') ||
    codLower.startsWith('11') ||
    codLower.startsWith('13')
  ) {
    return 'result'
  }
  
  return undefined
}

function parseCodPlanoconta(cod: string): number {
  // Extrair o número principal do código (ex: "1" de "1.1.1")
  const match = cod.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function getItemLevel(codPlanoconta: string): number {
  // Contar quantos pontos há no código para determinar o nível
  return (codPlanoconta.match(/\./g) || []).length
}

export function buildDREHierarchy(rows: SheetRow[]): DREItemData[] {
  if (rows.length === 0) return []
  
  // Ordenar por código para manter ordem sequencial
  const sortedRows = [...rows].sort((a, b) => {
    const codA = a.codPlanoconta
    const codB = b.codPlanoconta
    
    // Comparar códigos numericamente
    const partsA = codA.split('.').map((p) => parseInt(p, 10) || 0)
    const partsB = codB.split('.').map((p) => parseInt(p, 10) || 0)
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0
      const partB = partsB[i] || 0
      if (partA !== partB) {
        return partA - partB
      }
    }
    
    return 0
  })
  
  // Construir lista sequencial - TODOS os itens em ordem
  const items: DREItemData[] = []
  const itemMap = new Map<string, DREItemData>()
  
  for (const row of sortedRows) {
    const level = getItemLevel(row.codPlanoconta)
    const parentCode = level > 0 
      ? row.codPlanoconta.substring(0, row.codPlanoconta.lastIndexOf('.'))
      : null
    
    const item: DREItemData = {
      id: row.codPlanoconta || `item-${items.length}`,
      label: row.plano || '',
      value: row.valor || 0,
      type: detectItemType(row.plano, row.codPlanoconta),
      children: [],
    }
    
    itemMap.set(item.id, item)
    
    // Se tem pai, adicionar como filho
    if (parentCode && itemMap.has(parentCode)) {
      const parent = itemMap.get(parentCode)!
      if (!parent.children) {
        parent.children = []
      }
      parent.children.push(item)
    } else {
      // Item raiz - adicionar à lista principal
      items.push(item)
    }
  }
  
  // Calcular subtotais para itens marcados com SUBTOTAL = 1
  function calculateSubtotals(node: DREItemData, originalRow?: SheetRow): void {
    if (node.children && node.children.length > 0) {
      // Primeiro calcular subtotais dos filhos
      node.children.forEach(child => {
        const childRow = sortedRows.find(r => r.codPlanoconta === child.id)
        calculateSubtotals(child, childRow)
      })
      
      // Se for subtotal, calcular soma dos filhos
      const row = originalRow || sortedRows.find(r => r.codPlanoconta === node.id)
      if (row && row.subtotal === 1) {
        const sum = node.children.reduce((acc, child) => acc + (child.value || 0), 0)
        // Se o valor original era 0, usar a soma calculada
        if (node.value === 0 || Math.abs(node.value) < 0.01) {
          node.value = sum
        }
      }
    }
  }
  
  items.forEach(item => {
    const row = sortedRows.find(r => r.codPlanoconta === item.id)
    calculateSubtotals(item, row)
  })
  
  return items
}
