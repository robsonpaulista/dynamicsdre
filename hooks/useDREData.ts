'use client'

import { useState, useEffect } from 'react'
import type { DRERowData } from '@/types/dre'

interface DREResponse {
  data: DRERowData[]
  sheets?: string[]
  error?: string
}

export function useDREData(year: number = 2025) {
  const [data, setData] = useState<DRERowData[]>([])
  const [sheets, setSheets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Buscar dados filtrando por ano
        const response = await fetch(`/api/dre?year=${year}`)
        const result: DREResponse = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao buscar dados')
        }
        
        setData(result.data || [])
        setSheets(result.sheets || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        setData([])
        setSheets([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [year])
  
  return { data, sheets, loading, error }
}
