# 📊 Guia de Configuração - Google Sheets API

Este guia detalhado vai te ajudar a configurar a integração com o Google Sheets para buscar dados da sua planilha DRE diretamente no dashboard.

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Acesso ao Google Cloud Console
- Planilha no Google Drive com os dados da DRE

---

## 🚀 Passo a Passo Completo

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Faça login com sua conta Google
3. Clique em **"Selecionar projeto"** no topo
4. Clique em **"Novo Projeto"**
5. Preencha:
   - **Nome do projeto**: `DRE Gerencial` (ou outro nome de sua escolha)
   - **Organização**: (opcional)
6. Clique em **"Criar"**

### Passo 2: Ativar as APIs Necessárias

Você precisa ativar **duas APIs**:

#### 2.1: Google Sheets API

1. No menu lateral, vá em **"APIs e Serviços"** > **"Biblioteca"**
2. Na barra de pesquisa, digite **"Google Sheets API"**
3. Clique em **"Google Sheets API"**
4. Clique no botão **"Ativar"**
5. Aguarde alguns segundos até aparecer a mensagem de confirmação

#### 2.2: Google Drive API (para arquivos Excel)

1. Ainda na biblioteca de APIs, procure por **"Google Drive API"**
2. Clique em **"Google Drive API"**
3. Clique no botão **"Ativar"**
4. Aguarde alguns segundos até aparecer a mensagem de confirmação

**⚠️ IMPORTANTE:** Se você usa arquivos Excel no Google Drive, **ambas as APIs** devem estar ativadas!

### Passo 3: Criar Conta de Serviço

1. No menu lateral, vá em **"APIs e Serviços"** > **"Credenciais"**
2. Clique em **"Criar credenciais"** no topo
3. Selecione **"Conta de serviço"**
4. Preencha:
   - **Nome**: `dre-service-account` (ou outro nome)
   - **ID da conta de serviço**: será gerado automaticamente
   - **Descrição**: `Conta de serviço para acesso ao Google Sheets`
5. Clique em **"Criar e continuar"**
6. Na etapa de **"Conceder acesso a esta conta de serviço"**, você pode pular clicando em **"Continuar"**
7. Clique em **"Concluído"**

### Passo 4: Gerar Chave JSON

1. Na lista de contas de serviço, clique na conta que você acabou de criar
2. Vá na aba **"Chaves"**
3. Clique em **"Adicionar chave"** > **"Criar nova chave"**
4. Selecione o formato **JSON**
5. Clique em **"Criar"**
6. O arquivo JSON será baixado automaticamente
7. **⚠️ IMPORTANTE**: Guarde este arquivo em local seguro, ele não pode ser recuperado depois!

### Passo 5: Obter Informações do Arquivo JSON

Abra o arquivo JSON baixado. Ele terá este formato:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "dre-service-account@seu-projeto.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

Você vai precisar de:
- `client_email`: O email da conta de serviço
- `private_key`: A chave privada (mantenha as quebras de linha `\n`)

### Passo 6: Compartilhar Arquivo com a Conta de Serviço

#### Para Google Sheets:

1. Abra sua planilha no Google Sheets
2. Clique no botão **"Compartilhar"** (canto superior direito)
3. No campo de email, cole o `client_email` da conta de serviço (ex: `dre-service-account@seu-projeto.iam.gserviceaccount.com`)
4. Defina a permissão como **"Visualizador"** (read-only)
5. **Desmarque** a opção "Notificar pessoas" (não é necessário)
6. Clique em **"Compartilhar"**

#### Para Arquivos Excel no Google Drive:

1. Abra o arquivo Excel no Google Drive (via navegador)
2. Clique no botão **"Compartilhar"** (canto superior direito)
3. No campo de email, cole o `client_email` da conta de serviço
4. Defina a permissão como **"Visualizador"**
5. Clique em **"Compartilhar"**

📖 **Veja mais detalhes**: [docs/EXCEL_NO_DRIVE.md](EXCEL_NO_DRIVE.md)

### Passo 7: Obter o ID do Arquivo

#### Para Google Sheets:

O ID está na URL do Google Sheets:

```
https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit#gid=0
                                    ^^^^^^^^^^^^
                                    Este é o ID
```

Copie apenas a parte `ABC123XYZ789` (sem as barras).

#### Para Arquivos Excel no Google Drive:

O ID está na URL do Google Drive:

```
https://drive.google.com/file/d/ABC123XYZ789/view
                                    ^^^^^^^^^^^^
                                    Este é o ID
```

Ou quando você abre o Excel no Google Sheets:

```
https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit
                                    ^^^^^^^^^^^^
                                    Este é o ID
```

📖 **Veja mais detalhes**: [docs/EXCEL_NO_DRIVE.md](EXCEL_NO_DRIVE.md)

### Passo 8: Configurar Variáveis de Ambiente

1. Na raiz do projeto, crie um arquivo `.env.local` (se ainda não existir)
2. Adicione as seguintes variáveis:

```env
# ID da Planilha (extraído da URL)
GOOGLE_SHEETS_SPREADSHEET_ID=ABC123XYZ789

# Email da conta de serviço (do arquivo JSON)
GOOGLE_SHEETS_CLIENT_EMAIL=dre-service-account@seu-projeto.iam.gserviceaccount.com

# Chave privada (do arquivo JSON, mantenha as quebras de linha)
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**⚠️ CRÍTICO - Formato da PRIVATE_KEY:**

A chave privada é a parte mais sensível da configuração. Siga estes passos **exatamente**:

1. **Abra o arquivo JSON** baixado do Google Cloud Console
2. **Localize o campo** `"private_key"`
3. **Copie o valor completo** incluindo:
   - `-----BEGIN PRIVATE KEY-----`
   - Todo o conteúdo da chave
   - `-----END PRIVATE KEY-----`
4. **No `.env.local`**, cole entre aspas duplas e mantenha os `\n`:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[cole aqui o conteúdo completo]\n-----END PRIVATE KEY-----\n"
```

**✅ Formato Correto:**
- ✅ Aspas duplas `"` ao redor de toda a chave
- ✅ `\n` (barra invertida + n) para quebras de linha
- ✅ Mantém `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`

**❌ Formato Incorreto:**
- ❌ Quebras de linha reais (Enter) ao invés de `\n`
- ❌ Sem aspas duplas
- ❌ Espaços extras no início ou fim
- ❌ Remover os marcadores BEGIN/END

**💡 Dica:** Se tiver problemas, veja [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md) para soluções detalhadas.

### Passo 9: Verificar Estrutura da Planilha

A planilha deve ter uma estrutura organizada. Exemplo:

| Item | Valor | Tipo |
|------|-------|------|
| Receita Total | 1500000 | revenue |
| (-) Custos | -600000 | cost |
| (-) Despesas | -450000 | expense |
| Resultado | 450000 | result |

**Nota**: Você precisará ajustar a função `parseDREData` em `lib/googleSheets.ts` conforme a estrutura específica da sua planilha.

### Passo 10: Testar a Conexão

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a rota da API:
   ```
   http://localhost:3000/api/dre?period=2024-01
   ```

3. Se tudo estiver correto, você verá os dados da planilha em formato JSON.

---

## 🔧 Configuração Avançada

### Ajustar o Range da Planilha

No arquivo `app/api/dre/route.ts`, você pode ajustar o range:

```typescript
// Exemplo: buscar apenas da coluna A até Z, linhas 1 a 100
const range = `DRE!A1:Z100`

// Exemplo: buscar de uma aba específica
const range = `Aba1!A1:Z100`

// Exemplo: buscar todas as linhas de uma coluna
const range = `DRE!A:A`
```

### Personalizar Parsing dos Dados

Edite a função `parseDREData` em `lib/googleSheets.ts` para transformar os dados da planilha no formato esperado pelo dashboard:

```typescript
export function parseDREData(rows: string[][]): DREItemData[] {
  if (!rows || rows.length === 0) return []
  
  // Implemente sua lógica aqui
  // rows[0] = cabeçalhos
  // rows[1+] = dados
}
```

---

## ❌ Solução de Problemas

### Erro: "Google Sheets não configurado"

- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se todas as variáveis estão preenchidas
- Reinicie o servidor após criar/editar `.env.local`

### Erro: "Permission denied" ou "Insufficient permissions"

- Verifique se a planilha foi compartilhada com o `client_email`
- Verifique se a permissão está como "Visualizador" ou superior
- Aguarde alguns minutos após compartilhar (pode levar tempo para propagar)

### Erro: "Invalid credentials"

- Verifique se o `private_key` está completo e com as quebras de linha `\n`
- Verifique se o `client_email` está correto
- Verifique se não há espaços extras nas variáveis de ambiente

### Erro: "Spreadsheet not found"

- Verifique se o `GOOGLE_SHEETS_SPREADSHEET_ID` está correto
- Verifique se a planilha foi compartilhada com a conta de serviço
- Verifique se a planilha não foi excluída ou movida

### Dados não aparecem corretamente

- Verifique a estrutura da planilha
- Ajuste a função `parseDREData` conforme necessário
- Verifique o range especificado na API route

---

## 🔒 Segurança

### ⚠️ NUNCA faça:

- ❌ Commitar o arquivo `.env.local` no Git
- ❌ Compartilhar o arquivo JSON da conta de serviço
- ❌ Expor as credenciais em código público
- ❌ Dar permissões de escrita desnecessárias à conta de serviço

### ✅ SEMPRE faça:

- ✅ Mantenha `.env.local` no `.gitignore`
- ✅ Use apenas permissão de leitura (Visualizador) na planilha
- ✅ Guarde o arquivo JSON em local seguro
- ✅ Revise as permissões periodicamente

---

## 📚 Recursos Adicionais

- [Documentação Google Sheets API](https://developers.google.com/sheets/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Guia de Contas de Serviço](https://cloud.google.com/iam/docs/service-accounts)

---

## 💡 Dicas

1. **Teste primeiro**: Use uma planilha de teste antes de usar a planilha de produção
2. **Backup**: Mantenha backup do arquivo JSON da conta de serviço
3. **Logs**: Verifique os logs do servidor para debug (`console.log` no código)
4. **Rate Limits**: A API do Google Sheets tem limites de requisições (100 por 100 segundos por usuário)

---

## ✅ Checklist Final

- [ ] Projeto criado no Google Cloud Console
- [ ] Google Sheets API ativada
- [ ] Conta de serviço criada
- [ ] Chave JSON baixada e guardada
- [ ] Planilha compartilhada com a conta de serviço
- [ ] ID da planilha copiado
- [ ] Arquivo `.env.local` criado com todas as variáveis
- [ ] Servidor reiniciado
- [ ] Conexão testada com sucesso

---

Pronto! Sua integração com o Google Sheets está configurada. 🎉
