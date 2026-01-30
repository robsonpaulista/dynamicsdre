'use client'

import { useState, useEffect } from 'react'

export function useAvailableSheets() {
  const [sheets, setSheets] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchSheets() {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch('/api/dre/sheets')
        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao buscar abas')
        }
        
        setSheets(result.sheets || [])
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(errorMessage)
        setSheets([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchSheets()
  }, [])
  
  return { sheets, loading, error }
}
