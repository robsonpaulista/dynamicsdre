# 🔧 Erro 404: Planilha Não Encontrada

Se você está vendo o erro **"Requested entity was not found"** ou **"Planilha não encontrada"**, siga este guia passo a passo.

## 🔍 Diagnóstico

O erro 404 significa que a API do Google Sheets não conseguiu encontrar a planilha. Isso pode acontecer por:

1. ❌ **ID da planilha incorreto**
2. ❌ **Planilha não compartilhada com a conta de serviço**
3. ❌ **Planilha deletada ou movida**

## ✅ Solução Passo a Passo

### Passo 1: Verificar o ID da Planilha

1. Abra sua planilha no Google Sheets
2. Veja a URL no navegador:
   ```
   https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
   ```
3. Copie o ID (a parte entre `/d/` e `/edit`)

**Exemplo:**
- URL: `https://docs.google.com/spreadsheets/d/1ABC123XYZ789/edit`
- ID: `1ABC123XYZ789`

### Passo 2: Verificar o .env.local

1. Abra o arquivo `.env.local` na raiz do projeto
2. Verifique se o `GOOGLE_SHEETS_SPREADSHEET_ID` está correto:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1ABC123XYZ789
```

**⚠️ IMPORTANTE:**
- O ID deve ser exatamente como aparece na URL
- Não inclua barras `/` ou outros caracteres
- Não use aspas ao redor do ID

### Passo 3: Compartilhar a Planilha

**Esta é a causa mais comum do erro 404!**

1. Abra sua planilha no Google Sheets
2. Clique no botão **"Compartilhar"** (canto superior direito)
3. No campo de email, cole o email da conta de serviço:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```
4. Defina a permissão como **"Visualizador"**
5. **Desmarque** "Notificar pessoas" (não é necessário)
6. Clique em **"Compartilhar"**

### Passo 4: Verificar o Email da Conta de Serviço

O email correto está no arquivo `.env.local`:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
```

**Certifique-se de usar exatamente este email ao compartilhar!**

### Passo 5: Aguardar Propagação

Após compartilhar:
- ⏱️ Aguarde **2-5 minutos** para as permissões propagarem
- 🔄 Reinicie o servidor: `npm run dev`
- 🔍 Teste novamente

## 🧪 Testar a Conexão

### Teste 1: Listar Abas

Acesse no navegador ou use curl:

```bash
curl http://localhost:3000/api/dre/sheets
```

**Resposta esperada:**
```json
{
  "sheets": ["Aba1", "Aba2", "2024-01"],
  "count": 3
}
```

**Se der erro 404:** A planilha não foi encontrada ou não está compartilhada.

### Teste 2: Buscar Dados

```bash
curl http://localhost:3000/api/dre?period=2024-01&sheet=2024-01
```

**Se der erro 404:** Verifique se o nome da aba está correto.

## 🔄 Atualizar Configuração

Se você mudou o ID da planilha:

1. Edite o `.env.local`:
   ```env
   GOOGLE_SHEETS_SPREADSHEET_ID=novo_id_aqui
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

## 📋 Checklist de Verificação

Antes de reportar um problema, verifique:

- [ ] ID da planilha está correto no `.env.local`
- [ ] Planilha foi compartilhada com a conta de serviço
- [ ] Email da conta de serviço está correto
- [ ] Permissão está como "Visualizador"
- [ ] Aguardou alguns minutos após compartilhar
- [ ] Servidor foi reiniciado após mudanças no `.env.local`
- [ ] Planilha existe e está acessível no Google Sheets

## 🆘 Ainda com Problemas?

### Verificar Logs

Os logs do servidor mostrarão mais detalhes:

```
Erro ao buscar dados do Google Sheets: GaxiosError: Requested entity was not found.
```

### Verificar Permissões

1. Abra a planilha no Google Sheets
2. Clique em "Compartilhar"
3. Verifique se o email da conta de serviço aparece na lista
4. Se não aparecer, compartilhe novamente

### Testar com Outra Planilha

1. Crie uma planilha de teste
2. Compartilhe com a conta de serviço
3. Atualize o ID no `.env.local`
4. Teste novamente

Se funcionar com a planilha de teste, o problema é específico da planilha original.

## 💡 Dicas

- **Use o script de setup**: `npm run setup-env` para configurar automaticamente
- **Mantenha o ID atualizado**: Se você copiar/duplicar a planilha, atualize o ID
- **Verifique permissões periodicamente**: Permissões podem ser revogadas

---

**Próximos passos:**
- [Guia Completo de Configuração](GOOGLE_SHEETS_SETUP.md)
- [Solução de Problemas](TROUBLESHOOTING.md)
