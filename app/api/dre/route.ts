import { NextRequest, NextResponse } from 'next/server'
import { parseDREData, extractMonthFromDate } from '@/lib/googleSheets'
import { getSheetDataFromDrive } from '@/lib/googleDrive'
import { validateGoogleSheetsConfig } from '@/lib/googleSheetsAuth'
import { PLANO_CONTAS, getPlanoConta } from '@/lib/planoContas'
import { parseDespesasData, agruparDespesas, type DespesaAgrupada } from '@/lib/parseDespesas'
import { parseParticipacoesData, agruparParticipacoes, type ParticipacaoAgrupada } from '@/lib/parseParticipacoes'
import type { DRERowData } from '@/types/dre'

// Armazenar estrutura hierárquica de despesas por ano
const despesasHierarquiaPorAno = new Map<string, Map<string, DespesaAgrupada>>()
// Armazenar estrutura hierárquica de participações por ano
const participacoesHierarquiaPorAno = new Map<string, Map<string, ParticipacaoAgrupada>>()

export async function GET(request: NextRequest) {
  try {
    // Obter parâmetro de ano (padrão: 2025)
    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get('year')
    const selectedYear = yearParam ? parseInt(yearParam, 10) : 2025
    
    // Validar ano (2025-2030)
    if (isNaN(selectedYear) || selectedYear < 2025 || selectedYear > 2030) {
      return NextResponse.json(
        { error: 'Ano inválido. Use um ano entre 2025 e 2030.' },
        { status: 400 }
      )
    }
    
    // Configuração do Google Sheets (das variáveis de ambiente)
    let config
    try {
      config = validateGoogleSheetsConfig(
        process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        process.env.GOOGLE_SHEETS_PRIVATE_KEY
      )
    } catch (configError) {
      const errorMessage = configError instanceof Error ? configError.message : 'Erro na configuração'
      return NextResponse.json(
        { 
          error: `Erro na configuração do Google Sheets: ${errorMessage}`,
          hint: 'Verifique se todas as variáveis de ambiente estão configuradas corretamente no arquivo .env.local'
        },
        { status: 500 }
      )
    }
    
    const driveConfig = {
      fileId: config.spreadsheetId,
      credentials: config.credentials,
    }
    
    // Processar abas FATURAMENTO, DEVOLUÇÕES, BONIFICAÇÕES, TRIBUTOS, CMV, DESPESAS, IMPOSTOS e PARTICIPAÇÕES
    const targetSheets = ['faturamento', 'devolucoes', 'bonificacoes', 'tributos', 'cmv', 'despesas', 'impostos', 'participacoes']
    
    try {
      // Listar abas disponíveis primeiro
      const listResult = await getSheetDataFromDrive(driveConfig)
      const availableSheets = listResult.sheetNames
      
      // Processar cada aba
      const allParsedRows: ReturnType<typeof parseDREData> = []
      
      // Declarar estruturas de agrupamento antes do loop (para despesas)
      const dataByCodAndMonth = new Map<string, Map<string, number>>()
      const monthsSet = new Set<string>()
      const year = selectedYear.toString()
      
      for (const targetSheet of targetSheets) {
        // Buscar dados da aba (case insensitive)
        const targetSheetLower = targetSheet.toLowerCase()
        const foundSheet = availableSheets.find(s => s.toLowerCase() === targetSheetLower)
        
        if (!foundSheet) {
          continue
        }
        
        // Buscar dados da aba encontrada
        const result = await getSheetDataFromDrive(driveConfig, foundSheet)
        const sheetData = result.data
        
        if (!sheetData || sheetData.length < 2) {
          continue
        }
        
        // Processar despesas de forma especial (com agrupamento hierárquico)
        if (targetSheetLower === 'despesas') {
          try {
            const despesasRows = parseDespesasData(sheetData)

            if (despesasRows.length > 0) {
              // Agrupar despesas por DESCGRUPOCONTA -> CONTA -> mês
              const despesasAgrupadas = agruparDespesas(despesasRows, year)

              // Armazenar estrutura hierárquica completa para uso posterior
              // Será usada ao criar a estrutura DRE para COD 8
              despesasHierarquiaPorAno.set(year, despesasAgrupadas)

              // Somar tudo para COD 8 (para exibição na tabela principal)
              if (!dataByCodAndMonth.has('8')) {
                dataByCodAndMonth.set('8', new Map())
              }
              const cod8Map = dataByCodAndMonth.get('8')!

              for (const [grupo, grupoData] of despesasAgrupadas.entries()) {
                for (const [mes, valor] of Object.entries(grupoData.valoresPorMes)) {
                  cod8Map.set(mes, (cod8Map.get(mes) || 0) + valor)
                  monthsSet.add(mes)
                }
              }
            }
          } catch (error) {
            console.error(`Erro ao processar despesas:`, error)
            // Continuar mesmo se der erro
          }
          continue // Pular processamento normal para despesas
        }

        // Processar participações de forma especial (com agrupamento hierárquico)
        if (targetSheetLower === 'participacoes' || targetSheetLower.includes('participacao')) {
          try {
            const participacoesRows = parseParticipacoesData(sheetData)

            if (participacoesRows.length > 0) {
              // Agrupar participações por CONTA -> mês
              const participacoesAgrupadas = agruparParticipacoes(participacoesRows, year)

              // Armazenar estrutura hierárquica completa para uso posterior
              // Será usada ao criar a estrutura DRE para COD 12
              participacoesHierarquiaPorAno.set(year, participacoesAgrupadas)

              // Somar tudo para COD 12 (para exibição na tabela principal)
              if (!dataByCodAndMonth.has('12')) {
                dataByCodAndMonth.set('12', new Map())
              }
              const cod12Map = dataByCodAndMonth.get('12')!

              for (const [conta, contaData] of participacoesAgrupadas.entries()) {
                for (const [mes, valor] of Object.entries(contaData.valoresPorMes)) {
                  cod12Map.set(mes, (cod12Map.get(mes) || 0) + valor)
                  monthsSet.add(mes)
                }
              }
            }
          } catch (error) {
            console.error(`Erro ao processar participações:`, error)
            // Continuar mesmo se der erro
          }
          continue // Pular processamento normal para participações
        }
        
        // Parsear dados (para outras abas)
        const parsedRows = parseDREData(sheetData)
        
        // Mapear CODPLANOCONTA baseado na aba
        // Aba "faturamento" -> CODPLANOCONTA 1
        // Aba "devolucoes" -> CODPLANOCONTA 2
        // Aba "bonificacoes" -> CODPLANOCONTA 3
        // Aba "tributos" -> CODPLANOCONTA 4
        // Aba "cmv" -> CODPLANOCONTA 6
        // Aba "impostos" -> CODPLANOCONTA 10
        let targetCodPlanoconta = '1' // padrão
        if (targetSheetLower === 'devolucoes') {
          targetCodPlanoconta = '2'
        } else if (targetSheetLower === 'bonificacoes') {
          targetCodPlanoconta = '3'
        } else if (targetSheetLower === 'tributos') {
          targetCodPlanoconta = '4'
        } else if (targetSheetLower === 'cmv') {
          targetCodPlanoconta = '6'
        } else if (targetSheetLower === 'impostos' || targetSheetLower.includes('imposto')) {
          targetCodPlanoconta = '10'
        }
        
        // Ajustar CODPLANOCONTA para todas as linhas desta aba
        const adjustedRows = parsedRows.map(row => ({
          ...row,
          codPlanoconta: targetCodPlanoconta
        }))
        
        if (adjustedRows.length > 0) {
          allParsedRows.push(...adjustedRows)
        }
      }
      
      if (allParsedRows.length === 0) {
        return NextResponse.json(
          { 
            error: 'Nenhum dado válido encontrado nas planilhas.',
            debug: {
              targetSheets,
              availableSheets
            }
          },
          { status: 404 }
        )
      }
      
      // Agrupar por CODPLANOCONTA principal e por mês (data)
      // Estrutura: CODPLANOCONTA principal (1, 2, 3, etc.) -> { mês -> valor total }
      // Processar CODPLANOCONTA 1 (FATURAMENTO), 2 (DEVOLUÇÕES), 3 (BONIFICAÇÕES), 4 (TRIBUTOS), 6 (CMV) e 8 (DESPESAS)
      
      let rowsProcessed = 0
      let rowsWithData = 0
      let rowsWithCod1 = 0
      let rowsWithCod2 = 0
      let rowsWithCod3 = 0
      let rowsWithCod4 = 0
      let rowsWithCod6 = 0
      let rowsWithCod8 = 0
      let rowsWithCod10 = 0
      
      for (const row of allParsedRows) {
        rowsProcessed++
        
        if (!row.codPlanoconta || !row.data) {
          continue
        }
        
        const cod = row.codPlanoconta.trim()
        const month = row.data // Já vem no formato YYYY-MM do parseDREData
        
        if (!cod || !month) {
          continue
        }
        
        // Filtrar por ano ANTES de processar
        if (!month.startsWith(year)) {
          continue
        }
        
        rowsWithData++
        
        // Extrair o código principal (ex: "1" de "1", "1.1", "1 1", "1 90", etc.)
        // Pode ter ponto ou espaço como separador
        const codPrincipal = cod.split(/[.\s]/)[0].trim()
        
        // Processar CODPLANOCONTA 1 (FATURAMENTO), 2 (DEVOLUÇÕES), 3 (BONIFICAÇÕES), 4 (TRIBUTOS), 6 (CMV) e 10 (IMPOSTOS)
        if (codPrincipal !== '1' && codPrincipal !== '2' && codPrincipal !== '3' && codPrincipal !== '4' && codPrincipal !== '6' && codPrincipal !== '10') {
          continue
        }
        
        if (codPrincipal === '1') rowsWithCod1++
        if (codPrincipal === '2') rowsWithCod2++
        if (codPrincipal === '3') rowsWithCod3++
        if (codPrincipal === '4') rowsWithCod4++
        if (codPrincipal === '6') rowsWithCod6++
        if (codPrincipal === '10') rowsWithCod10++
        
        monthsSet.add(month)
        
        // Agrupar por código principal (somar todos os subcódigos)
        if (!dataByCodAndMonth.has(codPrincipal)) {
          dataByCodAndMonth.set(codPrincipal, new Map())
        }
        
        const monthMap = dataByCodAndMonth.get(codPrincipal)!
        const currentValue = monthMap.get(month) || 0
        const newValue = currentValue + (row.valor || 0)
        monthMap.set(month, newValue)
      }
      
      // Meses já estão filtrados pelo ano acima
      const monthsInYear = Array.from(monthsSet).sort()
      
      if (monthsInYear.length === 0 || dataByCodAndMonth.size === 0) {
        return NextResponse.json(
          { 
            error: `Nenhum dado válido encontrado para o ano ${year}.`,
            debug: {
              rowsProcessed,
              rowsWithData,
              rowsWithCod1,
              rowsWithCod2,
              rowsWithCod3,
              rowsWithCod4,
              rowsWithCod6,
              rowsWithCod10,
              monthsFound: monthsInYear.length,
              dataByCodSize: dataByCodAndMonth.size,
              year
            }
          },
          { status: 404 }
        )
      }
      
      const months = monthsInYear
      
      // Criar estrutura de dados baseada no plano de contas
      const dreStructure: DRERowData[] = []
      
      // Map para armazenar valores calculados (COD 5, COD 7, etc.)
      const calculatedValues = new Map<string, Map<string, number>>()
      
      for (const planoItem of PLANO_CONTAS) {
        const cod = planoItem.codPlanoconta
        let monthMap = dataByCodAndMonth.get(cod) || new Map()
        
        // Calcular automaticamente Receita Operacional Líquida (COD 5)
        // Fórmula: COD 1 + COD 2 + COD 3 + COD 4 = COD 5
        // (Os valores de COD 2, 3 e 4 já estão negativos, então é soma mesmo)
        if (cod === '5') {
          const cod1Map = dataByCodAndMonth.get('1') || new Map()
          const cod2Map = dataByCodAndMonth.get('2') || new Map()
          const cod3Map = dataByCodAndMonth.get('3') || new Map()
          const cod4Map = dataByCodAndMonth.get('4') || new Map()
          
          // Criar novo Map para COD 5 calculado
          monthMap = new Map()
          for (const month of months) {
            const valor1 = cod1Map.get(month) || 0
            const valor2 = cod2Map.get(month) || 0
            const valor3 = cod3Map.get(month) || 0
            const valor4 = cod4Map.get(month) || 0
            const valorCalculado = valor1 + valor2 + valor3 + valor4
            monthMap.set(month, valorCalculado)
          }
          
          // Salvar o valor calculado para uso posterior
          calculatedValues.set('5', monthMap)
        }
        
        // Calcular automaticamente Lucro Bruto (COD 7)
        // Fórmula: COD 5 + COD 6 = COD 7
        // (COD 6 já está negativo, então a soma já resulta no valor correto)
        // IMPORTANTE: Usar o valor calculado do COD 5, não o do Map original
        if (cod === '7') {
          // Usar o valor calculado do COD 5 (não o do dataByCodAndMonth)
          const cod5Map = calculatedValues.get('5') || new Map()
          const cod6Map = dataByCodAndMonth.get('6') || new Map()
          
          // Criar novo Map para COD 7 calculado
          monthMap = new Map()
          for (const month of months) {
            const valor5 = cod5Map.get(month) || 0
            const valor6 = cod6Map.get(month) || 0
            const valorCalculado = valor5 + valor6
            monthMap.set(month, valorCalculado)
          }
          
          // Salvar o valor calculado para uso posterior
          calculatedValues.set('7', monthMap)
        }
        
        // Calcular automaticamente Resultado Operacional (COD 9)
        // Fórmula: COD 9 = COD 7 - COD 8
        // Resultado Operacional = Lucro Bruto - Despesas
        // IMPORTANTE: As despesas já estão armazenadas como valores negativos
        // Portanto: Lucro Bruto + Despesas (negativas) = Lucro Bruto - |Despesas|
        if (cod === '9') {
          // Usar o valor calculado do COD 7 (não o do dataByCodAndMonth)
          const cod7Map = calculatedValues.get('7') || new Map()
          const cod8Map = dataByCodAndMonth.get('8') || new Map()
          
          // Criar novo Map para COD 9 calculado
          monthMap = new Map()
          for (const month of months) {
            const valor7 = cod7Map.get(month) || 0 // Lucro Bruto
            const valor8 = cod8Map.get(month) || 0 // Despesas (já negativas)
            
            // Fórmula simples e correta: Lucro Bruto - Despesas
            // Como as despesas já estão negativas, fazemos: valor7 + valor8
            // Isso é equivalente a: valor7 - Math.abs(valor8)
            const valorCalculado = valor7 + valor8
            monthMap.set(month, valorCalculado)
          }
          
          // Salvar o valor calculado para uso posterior (se necessário)
          calculatedValues.set('9', monthMap)
        }
        
        // Calcular automaticamente Saldo (COD 11)
        // Fórmula: COD 11 = COD 9 - COD 10
        // Saldo = Resultado Operacional - Imposto Sob Resultado
        if (cod === '11') {
          // Usar o valor calculado do COD 9 (não o do dataByCodAndMonth)
          const cod9Map = calculatedValues.get('9') || new Map()
          const cod10Map = dataByCodAndMonth.get('10') || new Map()
          
          // Criar novo Map para COD 11 calculado
          monthMap = new Map()
          for (const month of months) {
            const valor9 = cod9Map.get(month) || 0 // Resultado Operacional
            const valor10 = cod10Map.get(month) || 0 // Imposto Sob Resultado
            
            // Fórmula simples: Resultado Operacional - Imposto Sob Resultado
            const valorCalculado = valor9 - valor10
            monthMap.set(month, valorCalculado)
          }
          
          // Salvar o valor calculado para uso posterior (se necessário)
          calculatedValues.set('11', monthMap)
        }
        
        // Calcular automaticamente Resultado Líquido (COD 13)
        // Fórmula: COD 13 = COD 11 + COD 12
        // Resultado Líquido = Saldo + Participações
        // IMPORTANTE: Respeitar o sinal das Participações
        // - Se Participações é positiva: soma ao Saldo (reduz o débito/prejuízo)
        // - Se Participações é negativa: subtrai do Saldo (aumenta o débito/prejuízo)
        if (cod === '13') {
          // Usar o valor calculado do COD 11 (não o do dataByCodAndMonth)
          const cod11Map = calculatedValues.get('11') || new Map()
          const cod12Map = dataByCodAndMonth.get('12') || new Map()
          
          // Criar novo Map para COD 13 calculado
          monthMap = new Map()
          for (const month of months) {
            const valor11 = cod11Map.get(month) || 0 // Saldo
            const valor12 = cod12Map.get(month) || 0 // Participações
            
            // Fórmula correta: Saldo + Participações
            // Se Participações é positiva, soma (reduz débito)
            // Se Participações é negativa, subtrai (aumenta débito)
            const valorCalculado = valor11 + valor12
            monthMap.set(month, valorCalculado)
          }
          
          // Salvar o valor calculado para uso posterior (se necessário)
          calculatedValues.set('13', monthMap)
        }
        
        // Criar objeto com valores por mês (apenas meses do ano selecionado)
        const valuesBySheet: Record<string, number> = {}
        for (const month of months) {
          const value = monthMap.get(month) || 0
          valuesBySheet[month] = value
        }
        
        // Para despesas (COD 8), criar estrutura hierárquica completa
        let children: DRERowData[] | undefined
        if (cod === '8') {
          const despesasAgrupadas = despesasHierarquiaPorAno.get(year)
          if (despesasAgrupadas && despesasAgrupadas.size > 0) {
            children = []
            
            // Criar estrutura: DESCGRUPOCONTA -> CONTA -> lançamentos
            for (const [grupoNome, grupoData] of despesasAgrupadas.entries()) {
              // Criar valores por mês para o grupo
              const grupoValuesBySheet: Record<string, number> = {}
              for (const month of months) {
                grupoValuesBySheet[month] = grupoData.valoresPorMes[month] || 0
              }
              
              // Criar filhos (contas) do grupo
              const contasChildren: DRERowData[] = []
              for (const [contaNome, contaData] of grupoData.contas.entries()) {
                // Criar valores por mês para a conta
                const contaValuesBySheet: Record<string, number> = {}
                for (const month of months) {
                  contaValuesBySheet[month] = contaData.valoresPorMes[month] || 0
                }
                
                contasChildren.push({
                  codPlanoconta: `8.${grupoNome}.${contaNome}`, // ID único
                  plano: contaNome,
                  subtotal: 0,
                  codFormato: 0,
                  valuesBySheet: contaValuesBySheet,
                  lancamentos: contaData.lancamentos, // Lançamentos para tooltip
                })
              }
              
              // Adicionar grupo como filho de COD 8
              children.push({
                codPlanoconta: `8.${grupoNome}`, // ID único
                plano: grupoNome,
                subtotal: 0,
                codFormato: 0,
                valuesBySheet: grupoValuesBySheet,
                children: contasChildren, // Contas como filhos do grupo
              })
            }
          }
        }

        // Para participações (COD 12), criar estrutura hierárquica completa
        if (cod === '12') {
          const participacoesAgrupadas = participacoesHierarquiaPorAno.get(year)
          if (participacoesAgrupadas && participacoesAgrupadas.size > 0) {
            children = []
            
            // Criar estrutura: CONTA -> lançamentos
            for (const [contaNome, contaData] of participacoesAgrupadas.entries()) {
              // Criar valores por mês para a conta
              const contaValuesBySheet: Record<string, number> = {}
              for (const month of months) {
                contaValuesBySheet[month] = contaData.valoresPorMes[month] || 0
              }
              
              // Adicionar conta como filho de COD 12
              children.push({
                codPlanoconta: `12.${contaNome}`, // ID único
                plano: contaNome,
                subtotal: 0,
                codFormato: 0,
                valuesBySheet: contaValuesBySheet,
                lancamentos: contaData.lancamentos, // Lançamentos para tooltip
              })
            }
          }
        }
        
        dreStructure.push({
          codPlanoconta: cod,
          plano: planoItem.plano,
          subtotal: planoItem.subtotal,
          codFormato: planoItem.codFormato,
          valuesBySheet,
          children, // Estrutura hierárquica para despesas
        })
      }
      
      return NextResponse.json({ 
        data: dreStructure,
        sheets: months, // Usar meses como "sheets" para compatibilidade com o componente
      })
      
    } catch (error: unknown) {
      const gaxiosError = error as { status?: number; code?: number; message?: string; response?: { data?: { error?: { message?: string } } } }

      // Se der erro 404
      if (gaxiosError.status === 404 || gaxiosError.code === 404) {
        return NextResponse.json(
          {
            error: 'Arquivo não encontrado ou não acessível.',
            fileId: config.spreadsheetId,
            clientEmail: config.credentials.client_email,
            possibleCauses: [
              'O ID do arquivo está incorreto no arquivo .env.local',
              'O arquivo não foi compartilhado com a conta de serviço',
              'A Google Drive API não está ativada',
              'O arquivo foi deletado ou movido',
            ],
            solution: [
              '1. ⚠️ IMPORTANTE: Ative a Google Drive API:',
              '   https://console.developers.google.com/apis/api/drive.googleapis.com/overview',
              '2. Verifique o ID do arquivo no Google Drive',
              '3. Compartilhe o arquivo com: ' + config.credentials.client_email,
              '4. Defina a permissão como "Visualizador" ou "Leitor"',
              '5. Aguarde 5-10 minutos após compartilhar',
              '6. Execute o teste: /api/dre/test-permissions',
            ],
          },
          { status: 404 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error('Erro ao buscar dados do Google Sheets:', error)

    const gaxiosError = error as { status?: number; code?: number; message?: string; response?: { data?: { error?: { message?: string } } } }

    // Mensagens de erro mais específicas
    if (gaxiosError.status === 403 || gaxiosError.code === 403) {
      return NextResponse.json(
        {
          error: 'Permissão negada. A conta de serviço não tem acesso à planilha.',
          solution: [
            `1. Compartilhe a planilha com: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`,
            '2. Defina a permissão como "Visualizador"',
            '3. Aguarde alguns minutos para propagar',
          ],
        },
        { status: 403 }
      )
    }

    const errorMessage = gaxiosError.message || gaxiosError.response?.data?.error?.message || 'Erro desconhecido'
    return NextResponse.json(
      {
        error: `Erro ao buscar dados: ${errorMessage}`,
        hint: 'Verifique os logs do servidor para mais detalhes.',
      },
      { status: 500 }
    )
  }
}
