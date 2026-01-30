import { google } from 'googleapis'
import * as XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
]

export interface GoogleDriveConfig {
  fileId: string
  credentials: {
    client_email: string
    private_key: string
    type?: string
    project_id?: string
    [key: string]: any // Permite outros campos do service account JSON
  }
}

/**
 * Lê as credenciais do service account JSON (mesma abordagem do jupi)
 */
function getServiceAccountCredentials(): any {
  // Tentar ler do arquivo JSON primeiro (como no jupi)
  try {
    const jsonFiles = fs.readdirSync(process.cwd()).filter(f => 
      f.endsWith('.json') && (
        f.includes('service') || 
        f.includes('gerencial') ||
        f.includes('dre-')
      )
    )
    
    if (jsonFiles.length > 0) {
      const jsonPath = path.join(process.cwd(), jsonFiles[0])
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8')
      return JSON.parse(jsonContent)
    }
  } catch (error) {
    console.error('Erro ao ler arquivo JSON:', error)
    // Se não encontrar arquivo, usar variáveis de ambiente
  }
  
  // Fallback: usar variáveis de ambiente
  if (process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    return {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID || 'dre-gerencial-485617',
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }
  
  throw new Error('Nenhuma credencial encontrada. Verifique se há um arquivo service-account.json ou se as variáveis de ambiente estão configuradas.')
}

/**
 * Busca um arquivo Excel do Google Drive e retorna os dados
 * Usa a mesma abordagem do projeto jupi que funciona com Excel sincronizado
 */
export async function getExcelFileFromDrive(
  config: GoogleDriveConfig,
  sheetName?: string
): Promise<string[][]> {
  // Usar GoogleAuth com credentials (mesma abordagem do jupi)
  // SEMPRE ler do arquivo JSON primeiro (como no jupi)
  const credentials = getServiceAccountCredentials()
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })

  const drive = google.drive({ version: 'v3', auth })

  // Baixar o arquivo Excel do Drive como stream (mesma abordagem do jupi)
  const fileResponse = await drive.files.get(
    {
      fileId: config.fileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
    }
  )

  // Converter stream para buffer (mesma abordagem do jupi)
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    fileResponse.data.on('data', (chunk: Buffer) => chunks.push(chunk))
    fileResponse.data.on('end', () => resolve())
    fileResponse.data.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)

  // Converter o buffer para workbook do XLSX
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
  })

  // Se sheetName foi especificado, usar essa aba
  // Caso contrário, usar a primeira aba
  const worksheetName = sheetName || workbook.SheetNames[0]
  const worksheet = workbook.Sheets[worksheetName]

  if (!worksheet) {
    throw new Error(
      `Aba "${sheetName}" não encontrada. Abas disponíveis: ${workbook.SheetNames.join(', ')}`
    )
  }

  // Converter para array de arrays (formato compatível)
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][]

  return data
}

/**
 * Lista as abas de um arquivo Excel no Google Drive
 */
export async function listExcelSheetNames(config: GoogleDriveConfig): Promise<string[]> {
  // Usar GoogleAuth com credentials (mesma abordagem do jupi)
  // SEMPRE ler do arquivo JSON primeiro (como no jupi)
  const credentials = getServiceAccountCredentials()
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })

  const drive = google.drive({ version: 'v3', auth })

  // Baixar o arquivo Excel do Drive como stream
  const fileResponse = await drive.files.get(
    {
      fileId: config.fileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
    }
  )

  // Converter stream para buffer
  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    fileResponse.data.on('data', (chunk: Buffer) => chunks.push(chunk))
    fileResponse.data.on('end', () => resolve())
    fileResponse.data.on('error', reject)
  })
  const buffer = Buffer.concat(chunks)

  // Ler apenas os nomes das abas sem processar todo o conteúdo
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    sheetStubs: true, // Não processar dados, apenas estrutura
  })

  return workbook.SheetNames
}

/**
 * Verifica se um arquivo é Excel ou Google Sheets
 */
export async function getFileInfo(config: GoogleDriveConfig): Promise<{
  mimeType: string
  name: string
  isExcel: boolean
  isGoogleSheets: boolean
}> {
  // Usar GoogleAuth com credentials (mesma abordagem do jupi)
  // SEMPRE ler do arquivo JSON primeiro (como no jupi)
  const credentials = getServiceAccountCredentials()
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })

  const drive = google.drive({ version: 'v3', auth })

  const fileInfo = await drive.files.get({
    fileId: config.fileId,
    fields: 'name, mimeType',
  })

  const mimeType = fileInfo.data.mimeType || ''
  const isExcel =
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.ms-excel.sheet.macroEnabled.12'
  const isGoogleSheets = mimeType === 'application/vnd.google-apps.spreadsheet'

  return {
    mimeType,
    name: fileInfo.data.name || '',
    isExcel,
    isGoogleSheets,
  }
}

/**
 * Busca arquivo Excel do Drive e converte para formato compatível
 * Segue a mesma abordagem do projeto jupi que funciona com Excel sincronizado
 * Tenta baixar como Excel primeiro, sem verificar tipo (como no jupi)
 */
export async function getSheetDataFromDrive(
  config: GoogleDriveConfig,
  sheetName?: string
): Promise<{ data: string[][]; sheetNames: string[] }> {
  // Tentar baixar como Excel primeiro (mesma abordagem do jupi - não verifica tipo antes)
  try {
    const sheetNames = await listExcelSheetNames(config)
    const targetSheet = sheetName || sheetNames[0]
    const data = await getExcelFileFromDrive(config, targetSheet)
    return { data, sheetNames }
  } catch (excelError: any) {
    // Se falhar ao baixar como Excel, pode ser Google Sheets nativo
    // Tentar usar Google Sheets API
    try {
      const { getSheetData, listSheetNames } = await import('./googleSheets')
      const sheetsConfig = {
        spreadsheetId: config.fileId,
        credentials: config.credentials,
      }
      
      let sheetNames: string[]
      try {
        sheetNames = await listSheetNames(sheetsConfig)
      } catch (error) {
        // Se não conseguir listar, tentar buscar dados mesmo assim
        sheetNames = [sheetName || 'Sheet1']
      }
      
      const targetSheet = sheetName || sheetNames[0]
      const data = await getSheetData(
        sheetsConfig,
        `${targetSheet}!A1:Z1000`
      )
      return { data, sheetNames }
    } catch (sheetsError) {
      // Se ambos falharem, propagar erro do Excel (mais provável)
      throw excelError
    }
  }
}
