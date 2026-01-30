/**
 * Processa a chave privada do Google Sheets para garantir formato correto
 */
export function processPrivateKey(privateKey: string): string {
  if (!privateKey) {
    throw new Error('Chave privada não fornecida')
  }

  // Remover espaços extras no início e fim
  let processed = privateKey.trim()

  // Se a chave já está entre aspas, remover
  if ((processed.startsWith('"') && processed.endsWith('"')) ||
      (processed.startsWith("'") && processed.endsWith("'"))) {
    processed = processed.slice(1, -1)
  }

  // Substituir diferentes formatos de quebra de linha
  // Suporta: \n literal, \\n (escaped), e quebras reais
  processed = processed
    .replace(/\\n/g, '\n')           // \\n -> \n
    .replace(/\\\\n/g, '\n')          // \\\\n -> \n
    .replace(/\r\n/g, '\n')           // Windows line breaks
    .replace(/\r/g, '\n')             // Mac line breaks

  // Garantir que começa e termina corretamente
  if (!processed.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Chave privada inválida: não contém BEGIN PRIVATE KEY')
  }

  if (!processed.includes('END PRIVATE KEY')) {
    throw new Error('Chave privada inválida: não contém END PRIVATE KEY')
  }

  return processed
}

/**
 * Valida e processa as credenciais do Google Sheets
 */
export function validateGoogleSheetsConfig(
  spreadsheetId: string | undefined,
  clientEmail: string | undefined,
  privateKey: string | undefined
): {
  spreadsheetId: string
  credentials: {
    client_email: string
    private_key: string
  }
} {
  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID não configurado')
  }

  if (!clientEmail) {
    throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL não configurado')
  }

  if (!privateKey) {
    throw new Error('GOOGLE_SHEETS_PRIVATE_KEY não configurado')
  }

  try {
    const processedKey = processPrivateKey(privateKey)
    
    return {
      spreadsheetId,
      credentials: {
        client_email: clientEmail.trim(),
        private_key: processedKey,
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar chave privada'
    throw new Error(`Erro na configuração: ${errorMessage}`)
  }
}
