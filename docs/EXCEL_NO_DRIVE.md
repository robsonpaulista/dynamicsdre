# 📊 Usando Arquivos Excel no Google Drive

Este guia explica como usar arquivos Excel (.xlsx) que estão sincronizados no Google Drive.

## 🎯 Suporte a Formatos

O sistema agora suporta:
- ✅ **Google Sheets** nativos (formato `.gsheet`)
- ✅ **Arquivos Excel** (.xlsx) no Google Drive
- ✅ **Detecção automática** do tipo de arquivo

## 📋 Pré-requisitos

### 1. Ativar Google Drive API

Além da Google Sheets API, você precisa ativar a **Google Drive API**:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **"APIs e Serviços"** > **"Biblioteca"**
3. Procure por **"Google Drive API"**
4. Clique em **"Ativar"**

### 2. Compartilhar Arquivo Excel

1. Abra o arquivo Excel no Google Drive (via navegador)
2. Clique em **"Compartilhar"** (canto superior direito)
3. Adicione o email da conta de serviço:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```
4. Defina permissão como **"Visualizador"**
5. Clique em **"Compartilhar"**

## 🔍 Obter o ID do Arquivo Excel

### Método 1: Via URL do Google Drive

1. Abra o arquivo Excel no Google Drive (navegador)
2. Veja a URL no navegador:
   ```
   https://drive.google.com/file/d/[ID_AQUI]/view
   ```
3. Copie o ID (parte entre `/d/` e `/view`)

**Exemplo:**
- URL: `https://drive.google.com/file/d/1ABC123XYZ789/view`
- ID: `1ABC123XYZ789`

### Método 2: Via Propriedades do Arquivo

1. Clique com botão direito no arquivo no Google Drive
2. Selecione **"Obter link"** ou **"Compartilhar"**
3. O ID aparecerá na URL gerada

### Método 3: Via Google Sheets (se convertido)

Se você abrir o Excel no Google Sheets:
```
https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
```

## ⚙️ Configuração

### 1. Configurar Variáveis de Ambiente

No arquivo `.env.local`:

```env
# ID do arquivo (Excel ou Google Sheets)
GOOGLE_SHEETS_SPREADSHEET_ID=1ABC123XYZ789

# Email da conta de serviço
GOOGLE_SHEETS_CLIENT_EMAIL=dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com

# Chave privada
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Nota:** O sistema detecta automaticamente se é Excel ou Google Sheets!

### 2. Usar Script Automático

Execute o script de configuração:

```bash
npm run setup-env
```

Depois, edite o `.env.local` e adicione o ID do arquivo Excel.

## 📊 Estrutura da Planilha Excel

A planilha Excel deve ter a mesma estrutura que o Google Sheets:

| CODPLANOCONTA | PLANO                          | SUBTOTAL | CODFORMATO | VALOR     |
|---------------|-------------------------------|----------|------------|-----------|
| 1             | 1 Receita Operacional Bruta   | 1        | 1          | 1500000   |
| 1.1           | Vendas de Produtos            | 0        | 0          | 1200000   |

Veja mais detalhes em: [docs/ESTRUTURA_PLANILHA.md](ESTRUTURA_PLANILHA.md)

## 🔄 Sincronização Automática

Se você usa **Google Drive para Desktop** (sincronização automática):

1. ✅ O arquivo Excel local é automaticamente sincronizado
2. ✅ Mudanças no arquivo local aparecem no Drive
3. ✅ O sistema lê diretamente do Drive (não do arquivo local)

**Importante:**
- O sistema sempre lê do Google Drive, não do arquivo local
- Certifique-se de que o arquivo está sincronizado antes de testar
- Aguarde alguns segundos após salvar para garantir sincronização

## 🧪 Testar a Conexão

### Teste 1: Listar Abas

```bash
curl http://localhost:3000/api/dre/sheets
```

**Resposta esperada:**
```json
{
  "sheets": ["Plan1", "Plan2", "2024-01"],
  "count": 3
}
```

### Teste 2: Buscar Dados

```bash
curl http://localhost:3000/api/dre?period=2024-01&sheet=Plan1
```

## ⚠️ Limitações e Considerações

### Tamanho do Arquivo

- Arquivos Excel muito grandes podem demorar para processar
- Recomendado: até 10MB por arquivo
- Se o arquivo for muito grande, considere dividir em múltiplas abas

### Formato Suportado

- ✅ `.xlsx` (Excel 2007+)
- ✅ `.xls` (Excel 97-2003) - limitado
- ✅ `.gsheet` (Google Sheets nativo)

### Performance

- Arquivos Excel são baixados completamente antes de processar
- Google Sheets nativos são mais rápidos (acesso direto)
- Para melhor performance, considere converter Excel para Google Sheets

## 🔄 Converter Excel para Google Sheets

Se quiser melhor performance:

1. Abra o arquivo Excel no Google Drive
2. Clique com botão direito > **"Abrir com"** > **"Google Planilhas"**
3. Isso criará uma cópia em formato Google Sheets
4. Use o ID da nova planilha no `.env.local`

## 🐛 Solução de Problemas

### Erro: "Tipo de arquivo não suportado"

**Causa:** O arquivo não é Excel nem Google Sheets.

**Solução:**
- Certifique-se de que o arquivo é `.xlsx` ou `.gsheet`
- Verifique o tipo MIME do arquivo no Google Drive

### Erro: "Arquivo não encontrado"

**Causa:** Arquivo não compartilhado ou ID incorreto.

**Solução:**
1. Verifique o ID do arquivo
2. Compartilhe o arquivo com a conta de serviço
3. Aguarde alguns minutos

### Erro: "Aba não encontrada"

**Causa:** Nome da aba incorreto.

**Solução:**
1. Liste as abas: `GET /api/dre/sheets`
2. Use o nome exato da aba no parâmetro `?sheet=nome_da_aba`

## ✅ Checklist

Antes de usar um arquivo Excel:

- [ ] Google Drive API está ativada
- [ ] Arquivo Excel está no Google Drive
- [ ] Arquivo foi compartilhado com a conta de serviço
- [ ] ID do arquivo está correto no `.env.local`
- [ ] Estrutura da planilha está correta (CODPLANOCONTA, PLANO, etc.)
- [ ] Arquivo está sincronizado (se usar Drive para Desktop)

## 📚 Documentação Relacionada

- [Guia Completo de Configuração](GOOGLE_SHEETS_SETUP.md)
- [Estrutura da Planilha](ESTRUTURA_PLANILHA.md)
- [Solução de Problemas](TROUBLESHOOTING.md)

---

**Dica:** Para melhor performance e funcionalidades avançadas, considere converter seu Excel para Google Sheets nativo!
