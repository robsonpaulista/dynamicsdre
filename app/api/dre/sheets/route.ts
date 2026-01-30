import { NextRequest, NextResponse } from 'next/server'
import { getSheetDataFromDrive } from '@/lib/googleDrive'
import { validateGoogleSheetsConfig } from '@/lib/googleSheetsAuth'

// Rota para listar todas as abas disponíveis na planilha
export async function GET(request: NextRequest) {
  try {
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
        { error: `Erro na configuração: ${errorMessage}` },
        { status: 500 }
      )
    }
    
    const driveConfig = {
      fileId: config.spreadsheetId,
      credentials: config.credentials,
    }
    
    const result = await getSheetDataFromDrive(driveConfig)
    
    return NextResponse.json({ 
      sheets: result.sheetNames,
      count: result.sheetNames.length,
    })
  } catch (error) {
    console.error('Erro ao listar abas:', error)
    
    const gaxiosError = error as { status?: number; code?: number; message?: string }
    
    if (gaxiosError.status === 404 || gaxiosError.code === 404) {
      return NextResponse.json(
        {
          error: 'Planilha não encontrada ou não acessível.',
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          possibleCauses: [
            'O ID da planilha está incorreto',
            'A planilha não foi compartilhada com a conta de serviço',
            'A planilha foi deletada',
          ],
          solution: [
            '1. Verifique o ID da planilha na URL do Google Sheets',
            `2. Compartilhe a planilha com: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`,
            '3. Defina permissão como "Visualizador"',
          ],
        },
        { status: 404 }
      )
    }
    
    if (gaxiosError.status === 403 || gaxiosError.code === 403) {
      return NextResponse.json(
        {
          error: 'Permissão negada. Compartilhe a planilha com a conta de serviço.',
          clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
          fileId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
          troubleshooting: [
            '1. Verifique se o arquivo foi compartilhado corretamente',
            `2. Email da conta de serviço: ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL}`,
            '3. Permissão recomendada: "Visualizador" (read-only)',
            '4. Aguarde 2-5 minutos após compartilhar',
            '5. Verifique se a Google Drive API está ativada',
            '6. Execute o teste de permissões: GET /api/dre/test-permissions',
          ],
        },
        { status: 403 }
      )
    }
    
    const errorMessage = gaxiosError.message || 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao listar abas: ${errorMessage}` },
      { status: 500 }
    )
  }
}
