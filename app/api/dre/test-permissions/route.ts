import { NextRequest, NextResponse } from 'next/server'
import { validateGoogleSheetsConfig } from '@/lib/googleSheetsAuth'
import { getFileInfo } from '@/lib/googleDrive'
import { google } from 'googleapis'

/**
 * Rota de teste para diagnosticar problemas de permissão
 */
export async function GET(request: NextRequest) {
  try {
    const config = validateGoogleSheetsConfig(
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      process.env.GOOGLE_SHEETS_PRIVATE_KEY
    )

    const results: Record<string, any> = {
      config: {
        fileId: config.spreadsheetId,
        clientEmail: config.credentials.client_email,
        privateKeyLength: config.credentials.private_key.length,
      },
      tests: [],
    }

    // Teste 1: Verificar informações do arquivo
    try {
      const fileInfo = await getFileInfo({
        fileId: config.spreadsheetId,
        credentials: config.credentials,
      })
      results.tests.push({
        name: 'Informações do arquivo',
        status: 'success',
        data: fileInfo,
      })
    } catch (error: unknown) {
      const gaxiosError = error as { status?: number; message?: string; response?: { data?: any } }
      results.tests.push({
        name: 'Informações do arquivo',
        status: 'error',
        error: {
          status: gaxiosError.status,
          message: gaxiosError.message,
          details: gaxiosError.response?.data,
        },
      })
    }

    // Teste 2: Tentar acessar via Google Drive API
    try {
      const auth = new google.auth.JWT({
        email: config.credentials.client_email,
        key: config.credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/spreadsheets.readonly',
        ],
      })

      const drive = google.drive({ version: 'v3', auth })
      const file = await drive.files.get({
        fileId: config.spreadsheetId,
        fields: 'id, name, mimeType, permissions, shared, owners',
      })

      results.tests.push({
        name: 'Acesso via Google Drive API',
        status: 'success',
        data: {
          id: file.data.id,
          name: file.data.name,
          mimeType: file.data.mimeType,
          shared: file.data.shared,
          hasPermissions: !!file.data.permissions,
          permissionsCount: file.data.permissions?.length || 0,
        },
      })
    } catch (error: unknown) {
      const gaxiosError = error as { status?: number; message?: string; response?: { data?: any } }
      results.tests.push({
        name: 'Acesso via Google Drive API',
        status: 'error',
        error: {
          status: gaxiosError.status,
          message: gaxiosError.message,
          details: gaxiosError.response?.data,
        },
      })
    }

    // Teste 3: Tentar acessar via Google Sheets API (se for Google Sheets)
    try {
      const auth = new google.auth.JWT({
        email: config.credentials.client_email,
        key: config.credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      })

      const sheets = google.sheets({ version: 'v4', auth })
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.spreadsheetId,
      })

      results.tests.push({
        name: 'Acesso via Google Sheets API',
        status: 'success',
        data: {
          title: spreadsheet.data.properties?.title,
          sheetsCount: spreadsheet.data.sheets?.length || 0,
          sheetNames: spreadsheet.data.sheets?.map((s) => s.properties?.title),
        },
      })
    } catch (error: unknown) {
      const gaxiosError = error as { status?: number; message?: string; response?: { data?: any } }
      results.tests.push({
        name: 'Acesso via Google Sheets API',
        status: 'error',
        error: {
          status: gaxiosError.status,
          message: gaxiosError.message,
          details: gaxiosError.response?.data,
        },
      })
    }

    // Resumo
    const successCount = results.tests.filter((t) => t.status === 'success').length
    const errorCount = results.tests.filter((t) => t.status === 'error').length

    results.summary = {
      total: results.tests.length,
      success: successCount,
      errors: errorCount,
      allPassed: errorCount === 0,
    }

    // Recomendações baseadas nos resultados
    const recommendations: string[] = []

    if (errorCount > 0) {
      // Verificar se Google Drive API não está ativada
      const driveApiErrors = results.tests.filter(
        (t) =>
          t.error?.message?.includes('Google Drive API has not been used') ||
          t.error?.message?.includes('SERVICE_DISABLED') ||
          t.error?.details?.error?.errors?.some((e: any) =>
            e.reason === 'accessNotConfigured'
          )
      )

      if (driveApiErrors.length > 0) {
        const projectId = driveApiErrors[0]?.error?.details?.error?.details?.find(
          (d: any) => d['@type'] === 'type.googleapis.com/google.rpc.ErrorInfo'
        )?.metadata?.consumer?.split('/').pop()

        recommendations.push(
          '🚨 PROBLEMA CRÍTICO: Google Drive API não está ativada!',
          '',
          `1. Ative a Google Drive API no projeto: ${projectId || 'seu projeto'}`,
          '   Link direto: https://console.developers.google.com/apis/api/drive.googleapis.com/overview',
          '2. Clique em "Ativar" ou "Enable"',
          '3. Aguarde alguns segundos',
          '4. Reinicie o servidor: npm run dev',
          '5. Teste novamente'
        )
      }

      // Verificar se é problema de ID incorreto ou compartilhamento
      const notFoundErrors = results.tests.filter((t) => t.error?.status === 404)
      if (notFoundErrors.length > 0 && !driveApiErrors.length) {
        // Verificar se o ID parece ser um GID (número curto)
        const fileId = config.spreadsheetId
        const isLikelyGid = /^\d{6,10}$/.test(fileId)

        if (isLikelyGid) {
          recommendations.push(
            '⚠️ ATENÇÃO: O ID parece ser um GID (identificador de aba), não o ID do arquivo!',
            '',
            'O ID correto está na URL do Google Sheets:',
            '  https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit',
            '',
            `ID atual (provavelmente incorreto): ${fileId}`,
            'Este parece ser o GID da aba, não o ID do arquivo.',
            '',
            'Para corrigir:',
            '1. Abra a planilha no Google Sheets',
            '2. Veja a URL: docs.google.com/spreadsheets/d/[ID_CORRETO]/edit',
            '3. Copie o ID (parte entre /d/ e /edit)',
            '4. Atualize o .env.local com o ID correto'
          )
        } else {
          // ID parece correto, então o problema é compartilhamento
          recommendations.push(
            '🚨 PROBLEMA: Arquivo não encontrado - Verifique o compartilhamento!',
            '',
            'O ID parece estar correto, mas o arquivo não está acessível.',
            'Isso geralmente significa que o arquivo não foi compartilhado corretamente.',
            '',
            'Solução:',
            '1. Abra o arquivo no Google Sheets/Drive',
            '2. Clique em "Compartilhar"',
            `3. Adicione o email: ${config.credentials.client_email}`,
            '4. Defina permissão como "Visualizador"',
            '5. Clique em "Compartilhar"',
            '6. Aguarde 5-10 minutos para propagar',
            '7. Reinicie o servidor: npm run dev',
            '',
            '📖 Veja o guia completo: docs/VERIFICAR_COMPARTILHAMENTO.md'
          )
        }
      }

      // Outros erros de permissão
      const permissionErrors = results.tests.filter(
        (t) =>
          (t.error?.status === 403 || t.error?.status === 404) &&
          !t.error?.message?.includes('Google Drive API has not been used')
      )

      if (permissionErrors.length > 0 && !driveApiErrors.length) {
        recommendations.push(
          '1. Verifique se o arquivo foi compartilhado com a conta de serviço',
          `2. Email da conta: ${config.credentials.client_email}`,
          '3. Permissão recomendada: "Visualizador" (read-only)',
          '4. Aguarde 2-5 minutos após compartilhar para propagar'
        )
      }
    }

    if (recommendations.length > 0) {
      results.recommendations = recommendations
    }

    return NextResponse.json(results, {
      status: results.summary.allPassed ? 200 : 500,
    })
  } catch (error) {
    console.error('Erro no teste de permissões:', error)
    return NextResponse.json(
      {
        error: 'Erro ao executar testes',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}
