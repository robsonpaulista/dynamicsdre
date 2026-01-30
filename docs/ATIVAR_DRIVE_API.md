# 🚨 ATIVAR GOOGLE DRIVE API - SOLUÇÃO PARA ERRO 404

## ⚠️ PROBLEMA CRÍTICO

Se você está vendo o erro:
```
File not found: 1XfB_C9pD9GeW3xEfAjAks5wnr4WDyv00X
```

**A causa mais provável é que a Google Drive API não está ativada!**

## ✅ SOLUÇÃO RÁPIDA (3 PASSOS)

### Passo 1: Ativar Google Drive API

1. **Clique neste link direto:**
   ```
   https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=576038096022
   ```

2. **Clique no botão "Ativar" ou "Enable"**

3. **Aguarde 30 segundos**

### Passo 2: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C) e reinicie:
npm run dev
```

### Passo 3: Testar

Acesse:
```
http://localhost:3000/api/dre/test-permissions
```

**Resultado esperado:**
- ✅ Informações do arquivo: success
- ✅ Acesso via Google Drive API: success
- ✅ Acesso via Google Sheets API: success

## 📋 Por Que Isso É Necessário?

Para acessar arquivos Excel no Google Drive, você **precisa** da Google Drive API ativada. Apenas a Google Sheets API não é suficiente.

## 🔍 Verificar se Está Ativada

1. Acesse: https://console.developers.google.com/apis/library?project=576038096022
2. Procure por "Google Drive API"
3. Se aparecer "Ativar", clique
4. Se aparecer "Gerenciar", já está ativada

## ⏱️ Tempo de Propagação

- Após ativar: **30 segundos a 2 minutos**
- Após compartilhar arquivo: **5-10 minutos**

## ✅ Checklist Completo

- [ ] Google Drive API ativada
- [ ] Arquivo compartilhado com a conta de serviço
- [ ] Permissão definida como "Visualizador"
- [ ] Aguardado 5-10 minutos após compartilhar
- [ ] Servidor reiniciado
- [ ] Teste executado: `/api/dre/test-permissions`

---

**Se ainda não funcionar, veja:**
- [Solução 404 Final](SOLUCAO_404_FINAL.md)
- [Verificar Compartilhamento](VERIFICAR_COMPARTILHAMENTO.md)
