# Design System - DRE Gerencial

## 🎨 Princípios de Design

### Objetivos Visuais
- **Profissionalismo**: Transmitir autoridade e confiança
- **Clareza**: Informações fáceis de ler e entender
- **Modernidade**: Interface atual e premium
- **Eficiência**: Decisões rápidas em menos de 30 segundos

## 🎨 Paleta de Cores

### Modo Claro (Light Mode)

#### Cores Principais
- **Primary**: `#0F2A44` - Azul Executivo
  - Uso: Elementos principais, títulos importantes
  - Hover: `#123A5F`
  
- **Secondary**: `#2E7BEF` - Azul Médio
  - Uso: Destaques, ações secundárias, links

#### Cores de Fundo
- **Background**: `#FFFFFF` - Branco puro
- **Background Soft**: `#F5F7FA` - Cinza muito claro
  - Uso: Fundo de seções, espaçamento visual

#### Cores de Texto
- **Text Primary**: `#0F172A` - Quase preto
  - Uso: Títulos, valores importantes
- **Text Secondary**: `#475569` - Cinza médio
  - Uso: Labels, descrições, textos secundários

#### Cores de Status
- **Success**: `#1E9E6A` - Verde
  - Uso: Valores positivos, receitas
- **Warning**: `#F59E0B` - Âmbar
  - Uso: Atenção, valores negativos moderados
- **Danger**: `#DC2626` - Vermelho (uso mínimo)
  - Uso: Apenas para alertas críticos

#### Bordas e Divisores
- **Border**: `#E5E7EB` - Cinza claro
  - Uso: Bordas de cards, divisores

---

### Modo Escuro (Dark Mode)

#### Cores Principais
- **Primary**: `#0B1F2A` - Azul Petróleo
- **Primary Surface**: `#102A3A` - Superfície primária
- **Secondary**: `#1E3A5F` - Azul Profundo
- **Accent**: `#5B9BFF` - Azul Claro
  - Uso: Destaques, elementos interativos

#### Cores de Fundo
- **Background**: `#0A0F14` - Preto azulado
- **Card Background**: `#111827` - Cinza escuro
  - Uso: Cards e superfícies elevadas

#### Cores de Texto
- **Text Primary**: `#F8FAFC` - Branco suave
- **Text Secondary**: `#CBD5E1` - Cinza claro

#### Cores de Status
- **Success**: `#22C55E` - Verde claro
- **Warning**: `#FBBF24` - Amarelo
- **Danger**: `#F87171` - Vermelho suave

#### Bordas
- **Border**: `#1F2937` - Cinza escuro sutil

---

## 📐 Espaçamento

### Sistema de Grid
- Base: `4px`
- Valores comuns: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`

### Padding de Cards
- Padrão: `24px` (p-6)
- Compacto: `16px` (p-4)
- Espaçoso: `32px` (p-8)

### Gap entre Elementos
- Cards: `16px` (gap-4) mobile, `24px` (gap-6) desktop
- Grid: `16px` mobile, `24px` desktop

---

## 🔤 Tipografia

### Fonte
- **Família**: Inter (fallback: system-ui, sans-serif)
- **Pesos**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Tamanhos
- **H1**: `2xl` (24px) - Títulos principais
- **H2**: `xl` (20px) - Títulos de seção
- **H3**: `lg` (18px) - Títulos de card
- **Body**: `base` (16px) - Texto padrão
- **Small**: `sm` (14px) - Labels, descrições
- **XS**: `xs` (12px) - Metadados, badges

### Pesos por Contexto
- **Valores Financeiros**: `700` (bold)
- **Títulos**: `600` (semibold)
- **Labels**: `500` (medium)
- **Texto Corrido**: `400` (regular)

---

## 🧱 Componentes

### Card
- **Border Radius**: `12px` (rounded-card)
- **Sombra Light**: Sutil, elevação leve
- **Sombra Dark**: Mais pronunciada para contraste
- **Padding**: `24px` padrão

### Button
- **Altura**: `40px` (md), `32px` (sm), `48px` (lg)
- **Border Radius**: `8px` (rounded-lg)
- **Padding Horizontal**: `16px` (md)

### Badge
- **Border Radius**: `9999px` (rounded-full)
- **Padding**: `2px 10px` (px-2.5 py-0.5)
- **Font Size**: `12px` (text-xs)

---

## 📱 Breakpoints Responsivos

```css
sm:  640px   /* Mobile grande */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Desktop grande */
2xl: 1536px  /* Desktop extra grande */
```

### Estratégia Mobile-First
- Base: Mobile (< 640px)
- `sm:` Tablet pequeno (≥ 640px)
- `md:` Tablet (≥ 768px)
- `lg:` Desktop (≥ 1024px)

---

## 🎯 Regras de UX

### Cores e Significados
1. **Verde**: Sempre positivo (receitas, crescimento)
2. **Âmbar/Amarelo**: Atenção (valores negativos moderados)
3. **Vermelho**: Uso mínimo, apenas crítico
4. **Cinza**: Neutro, valores negativos sem alarme

### Hierarquia Visual
1. **Valores Financeiros**: Maior destaque, peso 700
2. **Percentuais**: Secundário, menor tamanho
3. **Labels**: Discretos, cor secundária

### Espaçamento em Branco
- Muito espaço em branco para respiração visual
- Cards não devem parecer apertados
- Seções bem separadas

### Interatividade
- Hover states sempre presentes
- Transições suaves (200ms)
- Focus states acessíveis

---

## 🎨 Ícones

### Biblioteca
- **Lucide React**: Ícones outline minimalistas

### Tamanhos
- **Small**: `16px` (h-4 w-4)
- **Medium**: `20px` (h-5 w-5)
- **Large**: `24px` (h-6 w-6)

### Uso
- Sempre outline (não filled)
- Cor primária ou accent
- Alinhados com texto

---

## 📊 Gráficos

### Estilo
- Linhas e barras simples
- Sem grid pesado
- Cores do design system
- Tooltips customizados

### Cores de Gráficos
- **Receita**: Verde (success)
- **Despesas**: Âmbar (warning)
- **Margem**: Azul (primary/secondary)

---

## ✅ Checklist de Aplicação

Ao criar novos componentes:

- [ ] Usa cores do design system
- [ ] Suporta modo claro e escuro
- [ ] Responsivo (mobile-first)
- [ ] Tipografia consistente
- [ ] Espaçamento adequado
- [ ] Estados de hover/focus
- [ ] Transições suaves
- [ ] Acessibilidade (ARIA labels)
