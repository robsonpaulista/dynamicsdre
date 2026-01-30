#!/usr/bin/env node

/**
 * Script para configurar automaticamente o .env.local
 * a partir do arquivo JSON da conta de serviço do Google
 */

const fs = require('fs')
const path = require('path')

// Cores para o terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function findJsonFile() {
  const files = fs.readdirSync(process.cwd())
  const jsonFiles = files.filter(
    (file) =>
      file.endsWith('.json') &&
      file !== 'package.json' &&
      file !== 'package-lock.json' &&
      file !== 'tsconfig.json' &&
      file !== 'next-env.d.ts'
  )
  
  if (jsonFiles.length === 0) {
    log('❌ Nenhum arquivo JSON de conta de serviço encontrado!', 'red')
    process.exit(1)
  }
  
  if (jsonFiles.length > 1) {
    log(`⚠️  Múltiplos arquivos JSON encontrados:`, 'yellow')
    jsonFiles.forEach((file, index) => {
      log(`   ${index + 1}. ${file}`, 'yellow')
    })
    log(`\nUsando: ${jsonFiles[0]}`, 'yellow')
  }
  
  return jsonFiles[0]
}

function readJsonFile(filename) {
  try {
    const filePath = path.join(process.cwd(), filename)
    const content = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    log(`❌ Erro ao ler arquivo JSON: ${error.message}`, 'red')
    process.exit(1)
  }
}

function formatPrivateKey(privateKey) {
  // Garantir que a chave está formatada corretamente
  let key = privateKey.trim()
  
  // Se não começar com BEGIN, adicionar
  if (!key.includes('BEGIN PRIVATE KEY')) {
    key = `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----\n`
  }
  
  // Garantir que tem as quebras de linha corretas
  key = key.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  
  // Garantir que termina com END
  if (!key.includes('END PRIVATE KEY')) {
    key = `${key}\n-----END PRIVATE KEY-----\n`
  }
  
  return key
}

function readExistingEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    return {}
  }
  
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  
  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Remover aspas se existirem
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        env[key] = value
      }
    }
  })
  
  return env
}

function writeEnvFile(env) {
  const envPath = path.join(process.cwd(), '.env.local')
  const lines = [
    '# Configuração do Google Sheets API',
    '# Gerado automaticamente pelo script setup-env.js',
    '#',
    '',
    `# ID da Planilha (extraído da URL do Google Sheets)`,
    `# Exemplo: https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit`,
    `GOOGLE_SHEETS_SPREADSHEET_ID=${env.GOOGLE_SHEETS_SPREADSHEET_ID || ''}`,
    '',
    `# Email da conta de serviço`,
    `GOOGLE_SHEETS_CLIENT_EMAIL=${env.GOOGLE_SHEETS_CLIENT_EMAIL}`,
    '',
    `# Chave privada (mantenha as quebras de linha \\n)`,
    `GOOGLE_SHEETS_PRIVATE_KEY="${env.GOOGLE_SHEETS_PRIVATE_KEY}"`,
    '',
  ]
  
  fs.writeFileSync(envPath, lines.join('\n'), 'utf8')
  log(`✅ Arquivo .env.local criado/atualizado com sucesso!`, 'green')
}

function main() {
  log('\n🔧 Configurando variáveis de ambiente do Google Sheets\n', 'cyan')
  
  // Encontrar arquivo JSON
  const jsonFile = findJsonFile()
  log(`📄 Lendo arquivo: ${jsonFile}`, 'blue')
  
  // Ler JSON
  const jsonData = readJsonFile(jsonFile)
  
  // Validar estrutura
  if (!jsonData.client_email) {
    log('❌ Arquivo JSON inválido: campo "client_email" não encontrado', 'red')
    process.exit(1)
  }
  
  if (!jsonData.private_key) {
    log('❌ Arquivo JSON inválido: campo "private_key" não encontrado', 'red')
    process.exit(1)
  }
  
  log('✅ Arquivo JSON válido!', 'green')
  
  // Ler .env.local existente (se houver)
  const existingEnv = readExistingEnv()
  
  // Preparar dados
  const env = {
    GOOGLE_SHEETS_CLIENT_EMAIL: jsonData.client_email,
    GOOGLE_SHEETS_PRIVATE_KEY: formatPrivateKey(jsonData.private_key),
    GOOGLE_SHEETS_SPREADSHEET_ID:
      existingEnv.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  }
  
  // Mostrar informações
  log('\n📋 Configurações encontradas:', 'cyan')
  log(`   Client Email: ${env.GOOGLE_SHEETS_CLIENT_EMAIL}`, 'blue')
  log(`   Private Key: ${env.GOOGLE_SHEETS_PRIVATE_KEY.length} caracteres`, 'blue')
  log(
    `   Spreadsheet ID: ${env.GOOGLE_SHEETS_SPREADSHEET_ID || '(vazio - configure manualmente)'}`,
    'blue'
  )
  
  if (!env.GOOGLE_SHEETS_SPREADSHEET_ID) {
    log(
      '\n⚠️  ATENÇÃO: O Spreadsheet ID não foi configurado!',
      'yellow'
    )
    log(
      '   Você precisa configurá-lo manualmente no arquivo .env.local',
      'yellow'
    )
    log(
      '   Para obter o ID, veja a URL da sua planilha:',
      'yellow'
    )
    log(
      '   https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit',
      'yellow'
    )
  }
  
  // Escrever arquivo
  writeEnvFile(env)
  
  log('\n✨ Próximos passos:', 'cyan')
  log('   1. Configure o GOOGLE_SHEETS_SPREADSHEET_ID no .env.local', 'blue')
  log('   2. Compartilhe sua planilha com a conta de serviço', 'blue')
  log('   3. Reinicie o servidor: npm run dev', 'blue')
  log('')
}

// Executar
main()
