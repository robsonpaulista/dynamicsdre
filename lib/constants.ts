// Configurações e constantes do sistema

export const APP_NAME = 'DRE Gerencial'

export const CURRENCY_FORMAT = {
  locale: 'pt-BR',
  currency: 'BRL',
} as const

export const PERCENT_FORMAT = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
} as const

export const DATE_FORMAT = {
  locale: 'pt-BR',
  options: {
    year: 'numeric',
    month: 'long',
  } as Intl.DateTimeFormatOptions,
} as const

// Breakpoints (alinhados com Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

// Configuração padrão de períodos
export const DEFAULT_PERIODS = [
  { value: '2025-01', label: 'Janeiro 2025' },
  { value: '2025-02', label: 'Fevereiro 2025' },
  { value: '2025-03', label: 'Março 2025' },
  { value: '2025-04', label: 'Abril 2025' },
  { value: '2025-05', label: 'Maio 2025' },
  { value: '2025-06', label: 'Junho 2025' },
  { value: '2025-07', label: 'Julho 2025' },
  { value: '2025-08', label: 'Agosto 2025' },
  { value: '2025-09', label: 'Setembro 2025' },
  { value: '2025-10', label: 'Outubro 2025' },
  { value: '2025-11', label: 'Novembro 2025' },
  { value: '2025-12', label: 'Dezembro 2025' },
] as const
