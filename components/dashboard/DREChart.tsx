'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { useIsDark } from '@/hooks/useIsDark'

interface ChartData {
  month: string
  revenue: number
  expenses: number
  margin: number
}

interface DREChartProps {
  data: ChartData[]
  type: 'revenue-expenses' | 'margin'
}

export function DREChart({ data, type }: DREChartProps) {
  const isDark = useIsDark()
  
  const textColor = isDark ? '#CBD5E1' : '#475569'
  const gridColor = isDark ? '#1F2937' : '#E5E7EB'
  const primaryColor = '#F97316' // Laranja vibrante (mesma paleta em ambos os modos)
  const successColor = isDark ? '#22C55E' : '#1E9E6A'
  const expenseColor = isDark ? '#F97316' : '#EA580C'
  
  interface TooltipProps {
    active?: boolean
    payload?: Array<{
      name: string
      value: number
      color: string
      payload: ChartData
    }>
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background dark:bg-dark-card border border-border dark:border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary mb-2">
            {payload[0].payload.month}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }
  
  if (type === 'revenue-expenses') {
    return (
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Receita vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="month"
                stroke={textColor}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke={textColor}
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="revenue"
                name="Receita"
                fill={successColor}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                name="Despesas"
                fill={expenseColor}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Evolução da Margem</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="month"
              stroke={textColor}
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke={textColor}
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="margin"
              name="Margem (%)"
              stroke={primaryColor}
              strokeWidth={2}
              dot={{ fill: primaryColor, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
