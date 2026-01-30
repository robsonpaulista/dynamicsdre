# 🔒 Erro 403: Permissão Negada

Se você está vendo o erro **"Permissão negada"** mesmo após compartilhar o arquivo, siga este guia de diagnóstico.

## ⚡ Solução Rápida

Se o erro menciona **"Google Drive API has not been used"** ou **"SERVICE_DISABLED"**:

👉 **[Veja o guia de ativação da API](ATIVAR_DRIVE_API.md)**

## 🔍 Diagnóstico Rápido

Execute o teste de permissões:

```bash
# No navegador ou terminal:
http://localhost:3000/api/dre/test-permissions
```

Este teste irá verificar:
- ✅ Se o arquivo existe e está acessível
- ✅ Se as APIs estão configuradas corretamente
- ✅ Se as permissões estão corretas
- ✅ Qual API está falhando (Drive ou Sheets)

## ❌ Causas Comuns

### 1. Permissões Ainda Não Propagaram

**Sintoma:** Arquivo compartilhado mas ainda dá erro 403

**Solução:**
- ⏱️ Aguarde **5-10 minutos** após compartilhar
- 🔄 Reinicie o servidor: `npm run dev`
- 🔍 Execute o teste de permissões novamente

### 2. Google Drive API Não Está Ativada

**Sintoma:** Erro 403 ao acessar arquivos Excel

**Solução:**
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **"APIs e Serviços"** > **"Biblioteca"**
3. Procure **"Google Drive API"**
4. Clique em **"Ativar"**
5. Aguarde alguns segundos
6. Reinicie o servidor

### 3. Email da Conta de Serviço Incorreto

**Sintoma:** Arquivo compartilhado mas com email errado

**Solução:**
1. Verifique o email correto no `.env.local`:
   ```env
   GOOGLE_SHEETS_CLIENT_EMAIL=dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```
2. Compartilhe o arquivo novamente com **exatamente** este email
3. Verifique se não há espaços extras ou caracteres incorretos

### 4. Permissão Incorreta

**Sintoma:** Arquivo compartilhado mas com permissão errada

**Solução:**
- ✅ Use **"Visualizador"** (read-only)
- ❌ Evite "Editor" se não for necessário
- ⚠️ "Proprietário" funciona mas não é necessário

### 5. Arquivo em Organização/Domínio Restrito

**Sintoma:** Arquivo compartilhado mas ainda bloqueado

**Solução:**
1. Verifique se há políticas de domínio/organização
2. Contate o administrador do Google Workspace (se aplicável)
3. Tente compartilhar com um usuário de teste primeiro

## ✅ Passo a Passo de Correção

### Passo 1: Verificar Compartilhamento

1. Abra o arquivo no Google Drive/Sheets
2. Clique em **"Compartilhar"**
3. Verifique se o email aparece na lista:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```
4. Se não aparecer, adicione novamente
5. Se aparecer, verifique a permissão (deve ser "Visualizador")

### Passo 2: Remover e Re-adicionar Permissão

Às vezes ajuda remover e adicionar novamente:

1. No diálogo de compartilhamento
2. Clique nos **três pontos** ao lado do email da conta de serviço
3. Selecione **"Remover acesso"**
4. Aguarde 30 segundos
5. Adicione novamente com permissão "Visualizador"
6. Aguarde 5 minutos

### Passo 3: Verificar APIs Ativadas

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **"APIs e Serviços"** > **"APIs habilitadas"**
3. Verifique se estão ativadas:
   - ✅ Google Sheets API
   - ✅ Google Drive API (necessário para arquivos Excel)

### Passo 4: Executar Teste de Permissões

```bash
# No navegador:
http://localhost:3000/api/dre/test-permissions

# Ou via curl:
curl http://localhost:3000/api/dre/test-permissions
```

Analise os resultados:
- ✅ **Todos os testes passaram**: Problema resolvido!
- ❌ **Algum teste falhou**: Veja a mensagem de erro específica

### Passo 5: Verificar Logs do Servidor

No terminal onde o servidor está rodando, procure por:

```
Erro ao buscar dados do Google Sheets: GaxiosError: ...
```

Os logs mostrarão detalhes específicos do erro.

## 🧪 Teste Manual

Você pode testar manualmente usando a API do Google:

### Teste 1: Verificar Arquivo

```bash
# Substitua [FILE_ID] pelo ID do arquivo
curl -H "Authorization: Bearer [TOKEN]" \
  "https://www.googleapis.com/drive/v3/files/[FILE_ID]?fields=id,name,permissions"
```

### Teste 2: Listar Permissões

```bash
curl -H "Authorization: Bearer [TOKEN]" \
  "https://www.googleapis.com/drive/v3/files/[FILE_ID]/permissions"
```

**Nota:** Você precisará gerar um token OAuth2 para esses testes. É mais fácil usar a rota `/api/dre/test-permissions`.

## 🔧 Solução Avançada

### Verificar Escopos da Conta de Serviço

Os escopos necessários são:
- `https://www.googleapis.com/auth/spreadsheets.readonly`
- `https://www.googleapis.com/auth/drive.readonly`

Eles estão configurados no código. Se você modificou, verifique se estão corretos.

### Verificar Domínio do Arquivo

Se o arquivo está em um Google Workspace:
1. Verifique políticas de compartilhamento
2. Contate o administrador se necessário
3. Considere usar uma conta pessoal para teste

## 📋 Checklist Completo

Antes de reportar um problema, verifique:

- [ ] Arquivo foi compartilhado com a conta de serviço
- [ ] Email da conta de serviço está correto (sem espaços extras)
- [ ] Permissão está como "Visualizador"
- [ ] Aguardou 5-10 minutos após compartilhar
- [ ] Google Drive API está ativada
- [ ] Google Sheets API está ativada
- [ ] Servidor foi reiniciado após mudanças
- [ ] Teste de permissões foi executado
- [ ] Logs do servidor foram verificados

## 🆘 Ainda com Problemas?

Se após seguir todos os passos o problema persistir:

1. **Execute o teste de permissões** e compartilhe os resultados
2. **Verifique os logs** do servidor e compartilhe mensagens de erro
3. **Tente com um arquivo de teste** simples para isolar o problema
4. **Verifique se funciona com Google Sheets nativo** (não Excel)

## 💡 Dicas

- **Use "Visualizador"**: É suficiente e mais seguro
- **Aguarde propagação**: Permissões podem levar alguns minutos
- **Teste incrementalmente**: Teste com arquivo simples primeiro
- **Verifique APIs**: Certifique-se de que ambas estão ativadas

---

**Próximos passos:**
- [Teste de Permissões](../api/dre/test-permissions)
- [Solução de Problemas](TROUBLESHOOTING.md)
- [Guia de Configuração](GOOGLE_SHEETS_SETUP.md)
