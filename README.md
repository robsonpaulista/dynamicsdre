# DRE Gerencial - Dashboard Executivo

Sistema moderno e premium para visualização de DRE Gerencial (Demonstração do Resultado do Exercício) com design system completo, suporte a modo claro/escuro e integração com Google Sheets.

## 🎨 Design System

### Modo Claro (Light Mode)
- **Primary**: Azul Executivo #0F2A44
- **Secondary**: Azul Médio #2E7BEF
- **Background**: Branco #FFFFFF
- **Background Soft**: #F5F7FA

### Modo Escuro (Dark Mode)
- **Primary**: Azul Petróleo #0B1F2A
- **Accent**: Azul Claro #5B9BFF
- **Background**: #0A0F14
- **Card Background**: #111827

## 🚀 Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones modernos
- **Recharts** - Gráficos
- **Google Sheets API** - Integração com planilhas

## 📦 Instalação

```bash
npm install
```

## 🔧 Configuração

### ⚡ Configuração Automática (Recomendado)

Se você tem o arquivo JSON da conta de serviço na raiz do projeto:

```bash
npm run setup-env
```

O script irá:
- ✅ Encontrar automaticamente o arquivo JSON
- ✅ Extrair as credenciais necessárias
- ✅ Criar/atualizar o arquivo `.env.local`
- ✅ Formatar a chave privada corretamente

📖 **Veja o guia completo**: [docs/SETUP_AUTOMATICO.md](docs/SETUP_AUTOMATICO.md)

### 📝 Configuração Manual

Se preferir configurar manualmente, crie um arquivo `.env.local` na raiz do projeto:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=seu_spreadsheet_id
GOOGLE_SHEETS_CLIENT_EMAIL=seu_client_email
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Opcional: para usar o Analista DRE com IA (Groq - gratuito)
GROQ_API_KEY=sua_chave_groq
```

**⚠️ IMPORTANTE**: A `PRIVATE_KEY` deve estar entre aspas duplas e manter as quebras de linha `\n`.

### Analista DRE com IA (Groq – gratuito)

Para usar o botão **"Analisar DRE com IA"** (analista que responde perguntas sobre a DRE), adicione no `.env.local`:

```env
GROQ_API_KEY=gsk_...
```

Obtenha uma chave gratuita em [console.groq.com](https://console.groq.com/) (limite: 30 requisições/minuto no tier gratuito). Opcional: `GROQ_MODEL=llama-3.1-8b-instant` (padrão).

O analista usa os dados da DRE carregada na tela para responder perguntas como: *"Quais despesas variaram mais de 10% no período?"*, *"Compare receita e lucro bruto por mês"*, etc.

### Configuração do Google Sheets API

Para um guia completo e detalhado passo a passo, consulte: **[docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md)**

**Resumo rápido:**

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google Sheets API**
4. Crie uma **Conta de Serviço**
5. Baixe as credenciais **JSON**
6. Compartilhe sua planilha com o email da conta de serviço (permissão: Visualizador)
7. Configure as variáveis de ambiente no `.env.local`
8. Reinicie o servidor

📖 **Veja o guia completo**: [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md)

## 🏃 Executando

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📱 Responsividade

O sistema é 100% responsivo e otimizado para:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1280px+)

## 🎯 Funcionalidades

- ✅ Dashboard executivo com métricas principais
- ✅ Visualização completa da DRE Gerencial
- ✅ Gráficos de Receita vs Despesas
- ✅ Evolução da Margem ao longo do tempo
- ✅ Modo claro/escuro
- ✅ Integração com Google Sheets
- ✅ Interface premium e profissional
- ✅ 100% responsivo

## 📂 Estrutura do Projeto

```
├── app/
│   ├── api/
│   │   └── dre/
│   │       └── route.ts     # API route para Google Sheets
│   ├── layout.tsx            # Layout principal
│   ├── page.tsx              # Página do dashboard
│   └── globals.css           # Estilos globais
├── components/
│   ├── ui/                   # Componentes base
│   │   ├── Card.tsx
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Select.tsx
│   │   └── Skeleton.tsx      # Loading states
│   └── dashboard/            # Componentes do dashboard
│       ├── Header.tsx
│       ├── MetricCard.tsx
│       ├── DREItem.tsx
│       ├── DREChart.tsx
│       └── LoadingState.tsx
├── contexts/
│   └── ThemeContext.tsx       # Contexto de tema
├── hooks/
│   └── useIsDark.ts          # Hook para detectar tema
├── lib/
│   ├── utils.ts              # Utilitários (formatação, cn)
│   ├── constants.ts          # Constantes do sistema
│   └── googleSheets.ts       # Integração Google Sheets
├── types/
│   └── dre.ts                # Tipos TypeScript
├── docs/
│   └── DESIGN_SYSTEM.md      # Documentação do design system
├── tailwind.config.ts        # Configuração Tailwind
├── tsconfig.json             # Configuração TypeScript
└── package.json
```

## 🎨 Componentes Disponíveis

### Card
Componente de card com variantes e suporte a modo escuro.

### Button
Botão com variantes: primary, secondary, ghost, outline.

### Badge
Badge para indicadores com variantes: success, warning, danger, neutral.

### MetricCard
Card especializado para exibir métricas financeiras com indicadores de variação.

### DREItem
Componente para exibir itens da DRE com suporte a hierarquia e colapso.

### DREChart
Gráficos especializados para visualização de dados financeiros.

## 🔄 Integração com Google Sheets e Excel

O sistema está **totalmente integrado** com Google Sheets e **arquivos Excel no Google Drive**, montando automaticamente a estrutura hierárquica da DRE baseada nos códigos de conta (CODPLANOCONTA).

### Funcionalidades

- ✅ **Suporte a Google Sheets** nativos
- ✅ **Suporte a arquivos Excel** (.xlsx) no Google Drive
- ✅ **Detecção automática** do tipo de arquivo
- ✅ **Parsing automático** da estrutura CODPLANOCONTA
- ✅ **Montagem hierárquica** baseada nos códigos
- ✅ **Cálculo automático** de subtotais (SUBTOTAL = 1)
- ✅ **Detecção automática** de tipos (receita, custo, despesa, resultado)
- ✅ **Suporte a múltiplas abas** (uma por período)
- ✅ **Listagem de abas** disponíveis

### Estrutura da Planilha

A planilha (Google Sheets ou Excel) deve ter as seguintes colunas:
- **CODPLANOCONTA**: Código hierárquico (ex: `1`, `1.1`, `1.1.1`)
- **PLANO**: Nome da conta (ex: `1 Receita Operacional Bruta`)
- **SUBTOTAL**: Flag 0/1 para indicar subtotais
- **CODFORMATO**: Código de formatação (opcional)
- **VALOR**: Valor financeiro

📖 **Veja a documentação completa**: 
- [Estrutura da Planilha](docs/ESTRUTURA_PLANILHA.md)
- [Usando Arquivos Excel](docs/EXCEL_NO_DRIVE.md)

### Como Usar

1. Configure as variáveis de ambiente (veja [docs/GOOGLE_SHEETS_SETUP.md](docs/GOOGLE_SHEETS_SETUP.md))
2. **Ative ambas as APIs**: Google Sheets API e Google Drive API
3. Compartilhe sua planilha/arquivo Excel com a conta de serviço
4. Acesse o dashboard - os dados serão carregados automaticamente
5. Use `?sheet=nome_da_aba` na URL para especificar uma aba específica

**📝 Nota:** Se você usa arquivos Excel sincronizados no Google Drive, veja: [docs/EXCEL_NO_DRIVE.md](docs/EXCEL_NO_DRIVE.md)

## 📝 Licença

Este projeto é privado e de uso interno.
