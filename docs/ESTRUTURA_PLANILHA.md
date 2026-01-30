# 📊 Estrutura Esperada da Planilha

Este documento descreve a estrutura que a planilha do Google Sheets deve ter para funcionar corretamente com o sistema DRE Gerencial.

## 📋 Colunas Obrigatórias

A planilha deve ter as seguintes colunas (nomes podem variar, mas devem conter as palavras-chave):

### 1. CODPLANOCONTA (Código da Conta)
- **Localização**: Coluna A (ou primeira coluna)
- **Formato**: Texto ou número
- **Exemplos**: `1`, `1.1`, `1.1.1`, `2`, `6`, `8`, etc.
- **Função**: Define a hierarquia e ordenação dos itens da DRE

### 2. PLANO (Nome da Conta)
- **Localização**: Coluna B (ou segunda coluna)
- **Formato**: Texto
- **Exemplos**: 
  - `1 Receita Operacional Bruta`
  - `2 (-) Devoluções`
  - `6 (-) CMV Última Entrada`
  - `7 (=) Lucro Bruto`
- **Função**: Nome descritivo do item da DRE

### 3. SUBTOTAL (Flag de Subtotal)
- **Localização**: Coluna C (ou terceira coluna)
- **Formato**: Número (0 ou 1)
- **Valores**:
  - `0`: Item não é subtotal (item individual)
  - `1`: Item é subtotal (soma de filhos)
- **Função**: Indica se o item deve somar seus filhos

### 4. CODFORMATO (Código de Formato)
- **Localização**: Coluna D (ou quarta coluna)
- **Formato**: Número (0 ou 1)
- **Valores**: Geralmente igual ao SUBTOTAL
- **Função**: Define formatação visual (opcional)

### 5. VALOR (Valor Financeiro)
- **Localização**: Qualquer coluna numérica após as anteriores
- **Formato**: Número (pode ter vírgula ou ponto como separador decimal)
- **Exemplos**: `1500000`, `1.500.000,00`, `1500000.00`
- **Função**: Valor financeiro do item

## 📐 Estrutura de Exemplo

```
| CODPLANOCONTA | PLANO                          | SUBTOTAL | CODFORMATO | VALOR     |
|---------------|-------------------------------|----------|------------|-----------|
| 1             | 1 Receita Operacional Bruta   | 1        | 1          | 1500000   |
| 1.1           | Vendas de Produtos            | 0        | 0          | 1200000   |
| 1.2           | Serviços                      | 0        | 0          | 300000    |
| 2             | 2 (-) Devoluções              | 0        | 0          | -50000    |
| 3             | 3 (-) Bonificações            | 0        | 0          | -30000    |
| 4             | 4 (-) Tributos                | 0        | 0          | -20000    |
| 5             | 5 (=) Receita Operacional Líquida | 1     | 1          | 1400000   |
| 6             | 6 (-) CMV Última Entrada      | 0        | 0          | -600000   |
| 7             | 7 (=) Lucro Bruto            | 1        | 1          | 800000    |
| 8             | 8 (-) Despesas Fixas/Variáveis | 1       | 1          | -350000   |
| 8.1           | Salários                     | 0        | 0          | -180000   |
| 8.2           | Aluguel                       | 0        | 0          | -50000    |
| 8.3           | Outras Despesas               | 0        | 0          | -120000   |
| 9             | 9 (=) Resultado Operacional  | 1        | 1          | 450000    |
```

## 🎯 Regras de Hierarquia

### Códigos de Conta
- **Nível 1**: Código simples (`1`, `2`, `3`)
- **Nível 2**: Código com um ponto (`1.1`, `1.2`, `8.1`)
- **Nível 3**: Código com dois pontos (`1.1.1`, `8.1.1`)
- E assim por diante...

### Detecção Automática de Tipo

O sistema detecta automaticamente o tipo de item baseado no nome (PLANO) e código:

- **Receita** (`revenue`):
  - Nome contém: "receita", "venda", "faturamento"
  - Código começa com: `1`

- **Custo** (`cost`):
  - Nome contém: "custo", "cmv"
  - Código começa com: `6`

- **Despesa** (`expense`):
  - Nome contém: "despesa", "gasto"
  - Código começa com: `8`

- **Resultado** (`result`):
  - Nome contém: "resultado", "lucro", "saldo"
  - Nome contém: `(=)` (igual entre parênteses)
  - Código começa com: `7`, `9`, `11`, `13`

## 📁 Múltiplas Abas

### Estrutura Recomendada

Cada aba deve representar um período (mês/ano):

- **Aba 1**: `2024-01` (Janeiro 2024)
- **Aba 2**: `2024-02` (Fevereiro 2024)
- **Aba 3**: `2024-03` (Março 2024)
- etc.

### Como Usar

Na API, especifique a aba usando o parâmetro `sheet`:

```
GET /api/dre?period=2024-01&sheet=2024-01
```

Se não especificar, o sistema tentará usar o período como nome da aba.

## 🔧 Cálculo de Subtotais

### Regra Automática

Itens com `SUBTOTAL = 1` terão seus valores calculados automaticamente somando todos os filhos:

```
Item Pai (SUBTOTAL=1, VALOR=0)
  ├─ Filho 1 (VALOR=1000) → soma
  ├─ Filho 2 (VALOR=2000) → soma
  └─ Filho 3 (VALOR=3000) → soma
Resultado: Item Pai (VALOR=6000)
```

### Valores Manuais

Se um item com `SUBTOTAL = 1` já tiver um valor definido, esse valor será mantido (não será sobrescrito).

## ⚠️ Problemas Comuns

### 1. Hierarquia Quebrada
**Problema**: Itens filhos aparecem antes dos pais
**Solução**: Ordene a planilha por CODPLANOCONTA

### 2. Valores Não Aparecem
**Problema**: Coluna de valor não é encontrada
**Solução**: Certifique-se de que há uma coluna numérica após CODFORMATO

### 3. Tipos Incorretos
**Problema**: Itens aparecem com tipo errado
**Solução**: Ajuste os nomes na coluna PLANO ou os códigos em CODPLANOCONTA

### 4. Subtotais Não Calculam
**Problema**: Itens com SUBTOTAL=1 não somam filhos
**Solução**: Verifique se a hierarquia está correta e se os filhos estão realmente dentro do pai

## ✅ Checklist de Validação

Antes de usar a planilha, verifique:

- [ ] Coluna CODPLANOCONTA existe e tem valores
- [ ] Coluna PLANO existe e tem nomes descritivos
- [ ] Coluna SUBTOTAL existe com valores 0 ou 1
- [ ] Coluna CODFORMATO existe (opcional, mas recomendado)
- [ ] Coluna de VALOR existe e tem números
- [ ] Códigos estão ordenados corretamente
- [ ] Hierarquia está correta (filhos após pais)
- [ ] Abas estão nomeadas corretamente (se usar múltiplas abas)

## 📝 Exemplo Completo de Planilha

Veja a imagem de referência fornecida para um exemplo visual completo da estrutura esperada.

---

**Nota**: O sistema é flexível e tenta detectar automaticamente as colunas mesmo com nomes ligeiramente diferentes. Se encontrar problemas, verifique os logs do servidor para mensagens de debug.
