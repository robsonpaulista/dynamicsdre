import { useState, useEffect, useCallback } from 'react'
import type { DRECustomizations } from '@/types/dre'

interface UseCustomizationsReturn {
  customizations: DRECustomizations | null
  loading: boolean
  error: string | null
  excludeItem: (itemId: string) => Promise<void>
  restoreItem: (itemId: string) => Promise<void>
  moveItem: (codPlanoconta: string, fromGrupo: string, toGrupo: string) => Promise<void>
  unmoveItem: (codPlanoconta: string) => Promise<void>
  addItem: (grupoDestino: string, descricao: string, valuesByMonth: Record<string, number>) => Promise<void>
  removeAddedItem: (itemId: string) => Promise<void>
  resetCustomizations: () => Promise<void>
  isItemExcluded: (itemId: string) => boolean
  getItemMovement: (codPlanoconta: string) => { fromGrupo: string; toGrupo: string } | null
  refresh: () => Promise<void>
}

export function useCustomizations(): UseCustomizationsReturn {
  const [customizations, setCustomizations] = useState<DRECustomizations | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Evitar cache do navegador
      const response = await fetch('/api/dre/customizations', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error('Erro ao carregar customizações')
      }
      const data = await response.json() as DRECustomizations
      // Garantir que addedItems existe
      if (!data.addedItems) {
        data.addedItems = []
      }
      setCustomizations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCustomizations()
  }, [fetchCustomizations])

  const postAction = useCallback(async (body: Record<string, unknown>) => {
    try {
      setError(null)
      const response = await fetch('/api/dre/customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar')
      }
      const data = await response.json() as { success: boolean; customizations: DRECustomizations }
      setCustomizations(data.customizations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [])

  const excludeItem = useCallback(async (itemId: string) => {
    await postAction({ action: 'exclude', itemId })
  }, [postAction])

  const restoreItem = useCallback(async (itemId: string) => {
    await postAction({ action: 'restore', itemId })
  }, [postAction])

  const moveItem = useCallback(async (codPlanoconta: string, fromGrupo: string, toGrupo: string) => {
    await postAction({ action: 'move', codPlanoconta, fromGrupo, toGrupo })
  }, [postAction])

  const unmoveItem = useCallback(async (codPlanoconta: string) => {
    await postAction({ action: 'unmove', codPlanoconta })
  }, [postAction])

  const addItem = useCallback(async (grupoDestino: string, descricao: string, valuesByMonth: Record<string, number>) => {
    await postAction({ action: 'add', grupoDestino, descricao, valuesByMonth })
  }, [postAction])

  const removeAddedItem = useCallback(async (itemId: string) => {
    await postAction({ action: 'removeAdded', itemId })
  }, [postAction])

  const resetCustomizations = useCallback(async () => {
    await postAction({ action: 'reset' })
  }, [postAction])

  const isItemExcluded = useCallback((itemId: string): boolean => {
    if (!customizations) return false
    return customizations.excludedItems.includes(itemId)
  }, [customizations])

  const getItemMovement = useCallback((codPlanoconta: string): { fromGrupo: string; toGrupo: string } | null => {
    if (!customizations) return null
    const movement = customizations.movedItems.find(m => m.codPlanoconta === codPlanoconta)
    return movement ? { fromGrupo: movement.fromGrupo, toGrupo: movement.toGrupo } : null
  }, [customizations])

  return {
    customizations,
    loading,
    error,
    excludeItem,
    restoreItem,
    moveItem,
    unmoveItem,
    addItem,
    removeAddedItem,
    resetCustomizations,
    isItemExcluded,
    getItemMovement,
    refresh: fetchCustomizations
  }
}
