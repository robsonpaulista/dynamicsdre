# ⚡ Configuração Automática do .env.local

Este guia mostra como configurar automaticamente o arquivo `.env.local` a partir do arquivo JSON da conta de serviço do Google.

## 🚀 Uso Rápido

Se você já tem o arquivo JSON da conta de serviço na raiz do projeto:

```bash
npm run setup-env
```

Pronto! O script irá:
1. ✅ Encontrar automaticamente o arquivo JSON
2. ✅ Extrair as credenciais necessárias
3. ✅ Criar/atualizar o arquivo `.env.local`
4. ✅ Formatar a chave privada corretamente

## 📋 Pré-requisitos

1. Arquivo JSON da conta de serviço do Google na raiz do projeto
   - Exemplo: `dre-gerencial-485617-b3d4df018896.json`
   - O arquivo deve ter os campos `client_email` e `private_key`

2. Node.js instalado (já deve estar instalado para rodar o projeto)

## 🔧 Como Funciona

O script `scripts/setup-env.js`:

1. **Procura** por arquivos JSON na raiz do projeto (exceto package.json, tsconfig.json, etc.)
2. **Lê** o arquivo JSON da conta de serviço
3. **Extrai** as informações:
   - `client_email` → `GOOGLE_SHEETS_CLIENT_EMAIL`
   - `private_key` → `GOOGLE_SHEETS_PRIVATE_KEY` (formatada corretamente)
4. **Preserva** o `GOOGLE_SHEETS_SPREADSHEET_ID` se já existir no `.env.local`
5. **Cria/atualiza** o arquivo `.env.local` com as configurações

## 📝 Exemplo de Uso

```bash
# 1. Certifique-se de que o arquivo JSON está na raiz
ls *.json

# 2. Execute o script
npm run setup-env

# 3. Saída esperada:
# 🔧 Configurando variáveis de ambiente do Google Sheets
# 📄 Lendo arquivo: dre-gerencial-485617-b3d4df018896.json
# ✅ Arquivo JSON válido!
# 📋 Configurações encontradas:
#    Client Email: dre-service-account@...
#    Private Key: 1679 caracteres
#    Spreadsheet ID: (vazio - configure manualmente)
# ✅ Arquivo .env.local criado/atualizado com sucesso!
```

## ⚙️ Configuração Manual do Spreadsheet ID

Após executar o script, você ainda precisa configurar o `GOOGLE_SHEETS_SPREADSHEET_ID`:

1. Abra o arquivo `.env.local`
2. Localize a linha `GOOGLE_SHEETS_SPREADSHEET_ID=`
3. Adicione o ID da sua planilha:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=ABC123XYZ789
```

**Como obter o ID:**
- Abra sua planilha no Google Sheets
- Veja a URL: `https://docs.google.com/spreadsheets/d/[ID_AQUI]/edit`
- Copie o ID e cole no `.env.local`

## 🔄 Atualizar Configurações

Se você precisar atualizar as configurações:

1. Execute novamente: `npm run setup-env`
2. O script preservará o `GOOGLE_SHEETS_SPREADSHEET_ID` existente
3. Atualizará apenas `client_email` e `private_key`

## ⚠️ Múltiplos Arquivos JSON

Se houver múltiplos arquivos JSON na raiz, o script:
- Mostrará todos os arquivos encontrados
- Usará o primeiro arquivo encontrado
- Você pode renomear ou mover os outros arquivos se necessário

## 🔒 Segurança

⚠️ **IMPORTANTE:**

- O arquivo `.env.local` está no `.gitignore` e **não será commitado**
- Os arquivos JSON também estão no `.gitignore` (padrão `*-*.json`)
- **Nunca** commite credenciais no Git
- Mantenha os arquivos JSON em local seguro

## ✅ Checklist Pós-Configuração

Após executar `npm run setup-env`:

- [ ] Arquivo `.env.local` foi criado
- [ ] `GOOGLE_SHEETS_CLIENT_EMAIL` está preenchido
- [ ] `GOOGLE_SHEETS_PRIVATE_KEY` está preenchido e formatado
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` foi configurado manualmente
- [ ] Planilha foi compartilhada com a conta de serviço
- [ ] Servidor foi reiniciado (`npm run dev`)

## 🐛 Solução de Problemas

### Erro: "Nenhum arquivo JSON encontrado"

**Solução:**
- Certifique-se de que o arquivo JSON está na raiz do projeto
- Verifique se o nome do arquivo termina com `.json`
- O arquivo não deve ser `package.json` ou `tsconfig.json`

### Erro: "Arquivo JSON inválido"

**Solução:**
- Verifique se o arquivo JSON tem os campos `client_email` e `private_key`
- Tente baixar novamente o arquivo JSON do Google Cloud Console

### Script não executa

**Solução:**
```bash
# Verifique se o Node.js está instalado
node --version

# Execute diretamente
node scripts/setup-env.js
```

## 📚 Próximos Passos

Após configurar o `.env.local`:

1. **Configure o Spreadsheet ID** (se ainda não configurou)
2. **Compartilhe a planilha** com a conta de serviço
3. **Reinicie o servidor**: `npm run dev`
4. **Teste a conexão**: Acesse `http://localhost:3000`

Veja também:
- [Guia Completo de Configuração](GOOGLE_SHEETS_SETUP.md)
- [Solução de Problemas](TROUBLESHOOTING.md)
- [Estrutura da Planilha](ESTRUTURA_PLANILHA.md)
