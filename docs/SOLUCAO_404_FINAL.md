# 🔧 Solução Definitiva para Erro 404

Se você está vendo **"File not found: 1XfB_C9pD9GeW3xEfAjAks5wnr4WDyv00X"** mesmo após compartilhar o arquivo, siga estes passos **na ordem**:

## ✅ Checklist Completo

### 1. Ativar Google Drive API (CRÍTICO)

**Este é o passo mais importante e geralmente é o problema!**

1. Acesse: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=576038096022
2. Clique em **"Ativar"** ou **"Enable"**
3. Aguarde **30 segundos**
4. **Reinicie o servidor**: `npm run dev`

### 2. Verificar Compartilhamento

1. Abra o arquivo no Google Sheets:
   ```
   https://docs.google.com/spreadsheets/d/1XfB_C9pD9GeW3xEfAjAks5wnr4WDyv00X/edit
   ```

2. Clique em **"Compartilhar"**

3. Verifique se o email aparece na lista:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```

4. **Se NÃO aparecer:**
   - Adicione o email manualmente
   - Permissão: **"Visualizador"** ou **"Leitor"**
   - **Desmarque** "Notificar pessoas"
   - Clique em **"Compartilhar"**

5. **Se aparecer:**
   - Verifique se a permissão está como **"Visualizador"** ou superior
   - Se estiver como "Editor", está OK também

### 3. Remover e Re-adicionar (Se Necessário)

Às vezes ajuda remover e adicionar novamente:

1. No diálogo de compartilhamento
2. Clique nos **três pontos** (⋮) ao lado do email da conta de serviço
3. Selecione **"Remover acesso"**
4. Aguarde **30 segundos**
5. Adicione novamente:
   - Email: `dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com`
   - Permissão: **"Visualizador"**
6. Clique em **"Compartilhar"**
7. Aguarde **5-10 minutos**

### 4. Verificar ID do Arquivo

O ID correto está na URL do Google Sheets:
```
https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit
```

**ID atual no .env.local:**
```
1XfB_C9pD9GeW3xEfAjAks5wnr4WDyv00X
```

**Verifique se está correto:**
1. Abra o arquivo no Google Sheets
2. Veja a URL na barra de endereço
3. O ID é a parte entre `/d/` e `/edit`
4. Compare com o ID no `.env.local`

### 5. Verificar Tipo de Arquivo

O arquivo pode ser:
- **Google Sheets nativo** (`.gsheet`)
- **Excel no Google Drive** (`.xlsx`)

**Para Excel:**
- O arquivo **deve estar no Google Drive** (não apenas sincronizado)
- Use o ID do arquivo no Google Drive (não o ID do Google Sheets se convertido)

### 6. Aguardar Propagação

- ⏱️ **Aguarde sempre 5-10 minutos** após compartilhar
- 🔄 **Reinicie o servidor** após mudanças
- ⚠️ **Ative a Google Drive API** antes de tudo

### 7. Testar Novamente

Após seguir todos os passos:

1. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Teste o endpoint:**
   ```
   http://localhost:3000/api/dre/test-permissions
   ```

3. **Resultado esperado:**
   ```json
   {
     "summary": {
       "allPassed": true,
       "success": 3,
       "errors": 0
     }
   }
   ```

## 🐛 Problemas Comuns

### Problema 1: "Google Drive API has not been used"

**Solução:**
- Ative a Google Drive API no link acima
- Aguarde 30 segundos
- Reinicie o servidor

### Problema 2: "File not found" mesmo compartilhado

**Possíveis causas:**
1. Google Drive API não ativada
2. Permissões não propagaram (aguarde 5-10 minutos)
3. Email da conta de serviço incorreto
4. Arquivo movido ou deletado

**Solução:**
1. Ative a Google Drive API
2. Remova e re-adicione o compartilhamento
3. Aguarde 10 minutos
4. Reinicie o servidor

### Problema 3: Permissão não salva

**Solução:**
1. Remova o acesso
2. Aguarde 1 minuto
3. Adicione novamente
4. Aguarde 5-10 minutos

## ✅ Ordem Correta de Execução

1. ✅ **Ativar Google Drive API** (mais importante!)
2. ✅ Verificar/compartilhar arquivo
3. ✅ Aguardar 5-10 minutos
4. ✅ Reiniciar servidor
5. ✅ Testar

## 📝 Nota Importante

- ⚠️ **A Google Drive API DEVE estar ativada** para arquivos Excel no Drive
- ⏱️ **Aguarde sempre** após compartilhar (5-10 minutos)
- 🔄 **Reinicie o servidor** após qualquer mudança
- ✅ **Use o endpoint de teste** para diagnosticar: `/api/dre/test-permissions`

---

**Se ainda não funcionar após seguir todos os passos, verifique:**
- [Solução de Problemas](TROUBLESHOOTING.md)
- [Erro 403 Permissão](ERRO_403_PERMISSAO.md)
- [Erro 404 Planilha](ERRO_404_PLANILHA.md)
