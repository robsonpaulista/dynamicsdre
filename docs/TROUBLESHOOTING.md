# 🔧 Solução de Problemas - Google Sheets

Este documento ajuda a resolver problemas comuns na integração com Google Sheets.

## ❌ Erro: "error:1E08010C:DECODER routines::unsupported"

Este erro indica que a chave privada não está sendo parseada corretamente.

### Causas Comuns:

1. **Quebras de linha incorretas** na variável de ambiente
2. **Aspas extras** na chave privada
3. **Encoding incorreto** do arquivo `.env.local`

### Soluções:

#### Solução 1: Formato Correto da Chave Privada

No arquivo `.env.local`, a chave privada deve estar assim:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**Pontos importantes:**
- ✅ Use aspas duplas `"` ao redor de toda a chave
- ✅ Mantenha os `\n` (não substitua por quebras de linha reais)
- ✅ Mantenha `-----BEGIN PRIVATE KEY-----` e `-----END PRIVATE KEY-----`
- ✅ Não adicione espaços extras no início ou fim

#### Solução 2: Copiar Diretamente do JSON

1. Abra o arquivo JSON baixado do Google Cloud Console
2. Localize o campo `"private_key"`
3. Copie o valor **exatamente como está** (incluindo as quebras de linha `\n`)
4. Cole no `.env.local` entre aspas duplas:

```env
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n[cole aqui o conteúdo]\n-----END PRIVATE KEY-----\n"
```

#### Solução 3: Verificar Encoding do Arquivo

Certifique-se de que o arquivo `.env.local` está salvo em **UTF-8**:

1. No VS Code: Clique com botão direito no arquivo > "Save with Encoding" > "UTF-8"
2. No Notepad++: Encoding > Convert to UTF-8

#### Solução 4: Usar Variável de Ambiente do Sistema

Se o problema persistir, você pode definir a variável diretamente no sistema:

**Windows (PowerShell):**
```powershell
$env:GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Linux/Mac:**
```bash
export GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Verificação:

Após configurar, teste se a chave está correta:

1. Reinicie o servidor: `npm run dev`
2. Acesse: `http://localhost:3000/api/dre/sheets`
3. Se funcionar, você verá a lista de abas
4. Se não funcionar, verifique os logs do servidor

---

## ❌ Erro: "Requested entity was not found" (404)

Este erro indica que a planilha não foi encontrada ou não está acessível.

### Causas Comuns:

1. **ID da planilha incorreto** no `.env.local`
2. **Planilha não compartilhada** com a conta de serviço
3. **Planilha deletada ou movida**

### Solução Rápida:

📖 **Veja o guia completo**: [docs/ERRO_404_PLANILHA.md](ERRO_404_PLANILHA.md)

**Passos principais:**

1. ✅ Verifique o ID da planilha na URL do Google Sheets
2. ✅ Compartilhe a planilha com: `dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com`
3. ✅ Defina permissão como "Visualizador"
4. ✅ Aguarde 2-5 minutos e reinicie o servidor

### Teste Rápido:

```bash
# Listar abas (deve retornar lista de abas, não erro 404)
curl http://localhost:3000/api/dre/sheets
```

---

## ❌ Erro: "Google Sheets não configurado"

### Verifique:

1. ✅ Arquivo `.env.local` existe na raiz do projeto
2. ✅ Todas as três variáveis estão preenchidas:
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
   - `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY`
3. ✅ Reiniciou o servidor após criar/editar `.env.local`

### Solução:

```bash
# Pare o servidor (Ctrl+C)
# Edite o .env.local
# Inicie novamente
npm run dev
```

---

## ❌ Erro: "Permission denied" ou "Insufficient permissions"

### Causa:
A planilha não foi compartilhada com a conta de serviço.

### Solução:

1. Abra sua planilha no Google Sheets
2. Clique em **"Compartilhar"** (canto superior direito)
3. Cole o email da conta de serviço (ex: `dre-service-account@seu-projeto.iam.gserviceaccount.com`)
4. Defina permissão como **"Visualizador"**
5. Clique em **"Compartilhar"**
6. Aguarde alguns minutos para propagar

---

## ❌ Erro: "Aba não encontrada"

### Causa:
O nome da aba não corresponde ao período selecionado.

### Solução:

1. Liste as abas disponíveis:
   ```
   GET http://localhost:3000/api/dre/sheets
   ```

2. Use o nome correto da aba:
   ```
   GET http://localhost:3000/api/dre?period=2024-01&sheet=nome_exato_da_aba
   ```

---

## ❌ Erro: "Estrutura da planilha inválida"

### Causa:
As colunas esperadas não foram encontradas.

### Verifique:

1. ✅ Coluna `CODPLANOCONTA` existe (pode ser "CODPLANOCONTA" ou "COD")
2. ✅ Coluna `PLANO` existe
3. ✅ Há uma coluna numérica com valores

### Solução:

Veja a documentação completa: [docs/ESTRUTURA_PLANILHA.md](ESTRUTURA_PLANILHA.md)

---

## 🔍 Debug Avançado

### Ver Logs Detalhados

No terminal onde o servidor está rodando, você verá mensagens de erro detalhadas. Procure por:

```
Erro ao buscar dados do Google Sheets: [mensagem de erro]
```

### Testar Configuração Manualmente

Crie um arquivo de teste `test-config.js`:

```javascript
const { validateGoogleSheetsConfig } = require('./lib/googleSheetsAuth')

try {
  const config = validateGoogleSheetsConfig(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    process.env.GOOGLE_SHEETS_PRIVATE_KEY
  )
  console.log('✅ Configuração válida!')
  console.log('Spreadsheet ID:', config.spreadsheetId)
  console.log('Client Email:', config.credentials.client_email)
  console.log('Private Key length:', config.credentials.private_key.length)
} catch (error) {
  console.error('❌ Erro:', error.message)
}
```

Execute:
```bash
node test-config.js
```

---

## 📞 Ainda com Problemas?

1. Verifique os logs do servidor
2. Confirme que todas as variáveis de ambiente estão corretas
3. Teste a conexão com uma planilha de teste simples
4. Verifique se a conta de serviço tem acesso à planilha

---

## ✅ Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] Arquivo `.env.local` existe e está na raiz do projeto
- [ ] Todas as três variáveis estão preenchidas
- [ ] Chave privada está entre aspas duplas
- [ ] Chave privada tem `\n` (não quebras de linha reais)
- [ ] Planilha foi compartilhada com a conta de serviço
- [ ] Servidor foi reiniciado após editar `.env.local`
- [ ] Nome da aba está correto (se usando múltiplas abas)
