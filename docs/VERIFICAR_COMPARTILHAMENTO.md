# 🔍 Verificar Compartilhamento do Arquivo

Se você está vendo erro **404 (File not found)** mesmo com o ID correto, o problema é de **compartilhamento**.

## ✅ Checklist de Verificação

### 1. Verificar se o Arquivo Foi Compartilhado

1. Abra o arquivo no Google Sheets/Drive
2. Clique em **"Compartilhar"** (canto superior direito)
3. Verifique se o email aparece na lista:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```

**Se NÃO aparecer:**
- Adicione o email manualmente
- Permissão: **"Visualizador"**
- Clique em **"Compartilhar"**

**Se aparecer:**
- Verifique a permissão (deve ser "Visualizador" ou superior)
- Se estiver como "Editor", está OK também

### 2. Verificar o Email Exato

O email deve ser **exatamente**:
```
dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
```

**Verifique:**
- ✅ Sem espaços antes ou depois
- ✅ Sem caracteres extras
- ✅ Todos os hífens e pontos corretos
- ✅ Domínio completo: `.iam.gserviceaccount.com`

### 3. Remover e Re-adicionar (Se Necessário)

Às vezes ajuda remover e adicionar novamente:

1. No diálogo de compartilhamento
2. Clique nos **três pontos** (⋮) ao lado do email
3. Selecione **"Remover acesso"**
4. Aguarde 30 segundos
5. Adicione novamente:
   - Email: `dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com`
   - Permissão: **"Visualizador"**
6. Clique em **"Compartilhar"**
7. Aguarde **5-10 minutos**

### 4. Verificar se o Arquivo Está Acessível

Teste se você consegue acessar o arquivo:

1. Abra uma **janela anônima/privada** do navegador
2. Tente acessar o arquivo pela URL
3. Se pedir login, o arquivo está restrito
4. Se abrir normalmente, o arquivo está público (isso não é necessário, mas ajuda no diagnóstico)

### 5. Verificar Propriedades do Arquivo

1. Clique com botão direito no arquivo no Google Drive
2. Selecione **"Detalhes"** ou **"Propriedades"**
3. Verifique:
   - ✅ Arquivo não está na lixeira
   - ✅ Arquivo não foi movido para outra pasta
   - ✅ Status de compartilhamento

## 🔧 Solução Passo a Passo

### Passo 1: Compartilhar Corretamente

1. Abra: `https://docs.google.com/spreadsheets/d/1XfB_C9pD9GeW3xEfAjAks5wnr4WDyv00X/edit`
2. Clique em **"Compartilhar"**
3. No campo de email, digite/copie:
   ```
   dre-service-account@dre-gerencial-485617.iam.gserviceaccount.com
   ```
4. Selecione permissão: **"Visualizador"**
5. **Desmarque** "Notificar pessoas"
6. Clique em **"Compartilhar"**

### Passo 2: Aguardar Propagação

- ⏱️ Aguarde **5-10 minutos** após compartilhar
- 🔄 As permissões podem levar tempo para propagar

### Passo 3: Verificar no Diálogo

1. Abra o diálogo de compartilhamento novamente
2. Verifique se o email aparece na lista
3. Verifique se a permissão está correta

### Passo 4: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

### Passo 5: Testar Novamente

```
http://localhost:3000/api/dre/test-permissions
```

## 🐛 Problemas Comuns

### Problema 1: Email Não Aparece na Lista

**Causa:** Compartilhamento não foi salvo ou email incorreto

**Solução:**
1. Verifique se digitou o email corretamente
2. Tente copiar e colar o email completo
3. Verifique se clicou em "Compartilhar" (não apenas "Copiar link")

### Problema 2: Permissão Não Salva

**Causa:** Problema temporário do Google

**Solução:**
1. Remova o acesso
2. Aguarde 1 minuto
3. Adicione novamente
4. Aguarde 5-10 minutos

### Problema 3: Arquivo em Organização Restrita

**Causa:** Políticas do Google Workspace

**Solução:**
1. Verifique políticas de compartilhamento
2. Contate administrador do Google Workspace
3. Considere usar conta pessoal para teste

## ✅ Teste Final

Após seguir todos os passos, execute:

```bash
http://localhost:3000/api/dre/test-permissions
```

**Resultado esperado:**
```json
{
  "summary": {
    "allPassed": true,
    "success": 3,
    "errors": 0
  }
}
```

## 📝 Nota Importante

- ⏱️ **Aguarde sempre 5-10 minutos** após compartilhar
- 🔄 **Reinicie o servidor** após mudanças
- ✅ **Verifique o email** está exatamente correto
- 🔍 **Use o teste de permissões** para diagnosticar

---

**Se ainda não funcionar após seguir todos os passos, verifique:**
- [Solução de Problemas](TROUBLESHOOTING.md)
- [Erro 403 Permissão](ERRO_403_PERMISSAO.md)
