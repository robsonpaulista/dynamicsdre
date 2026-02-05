import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { DRECustomizations, AddedItem } from '@/types/dre'

const DATA_FILE = path.join(process.cwd(), 'data', 'dre-customizations.json')

function ensureDataDir(): void {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readCustomizations(): DRECustomizations {
  ensureDataDir()
  
  if (!fs.existsSync(DATA_FILE)) {
    const defaultData: DRECustomizations = {
      excludedItems: [],
      movedItems: [],
      addedItems: [],
      updatedAt: undefined
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2))
    return defaultData
  }
  
  const content = fs.readFileSync(DATA_FILE, 'utf-8')
  const data = JSON.parse(content) as DRECustomizations
  // Garantir que addedItems existe (para compatibilidade com arquivos antigos)
  if (!data.addedItems) {
    data.addedItems = []
  }
  return data
}

function writeCustomizations(data: DRECustomizations): void {
  ensureDataDir()
  data.updatedAt = new Date().toISOString()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// Desabilitar cache para garantir dados atualizados
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/dre/customizations
 * Retorna as customizações salvas
 */
export async function GET(): Promise<NextResponse> {
  try {
    const customizations = readCustomizations()
    // Adicionar headers para evitar cache
    return NextResponse.json(customizations, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Erro ao ler customizações:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar customizações' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dre/customizations
 * Atualiza as customizações
 * 
 * Body esperado:
 * - action: 'exclude' | 'restore' | 'move' | 'unmove' | 'add' | 'removeAdded' | 'reset'
 * - itemId: string (para exclude/restore/removeAdded)
 * - codPlanoconta: string (para move/unmove)
 * - fromGrupo: string (para move)
 * - toGrupo: string (para move)
 * - grupoDestino: string (para add)
 * - descricao: string (para add)
 * - valuesByMonth: Record<string, number> (para add)
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { action } = body
    
    const customizations = readCustomizations()
    
    switch (action) {
      case 'exclude': {
        const { itemId } = body as { action: string; itemId: string }
        if (!itemId) {
          return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 })
        }
        // Evita duplicatas
        if (!customizations.excludedItems.includes(itemId)) {
          customizations.excludedItems.push(itemId)
        }
        break
      }
      
      case 'restore': {
        const { itemId } = body as { action: string; itemId: string }
        if (!itemId) {
          return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 })
        }
        customizations.excludedItems = customizations.excludedItems.filter(
          (id) => id !== itemId
        )
        break
      }
      
      case 'move': {
        const { codPlanoconta, fromGrupo, toGrupo } = body as {
          action: string
          codPlanoconta: string
          fromGrupo: string
          toGrupo: string
        }
        if (!codPlanoconta || !fromGrupo || !toGrupo) {
          return NextResponse.json(
            { error: 'codPlanoconta, fromGrupo e toGrupo são obrigatórios' },
            { status: 400 }
          )
        }
        // Remove movimentação anterior se existir
        customizations.movedItems = customizations.movedItems.filter(
          (m) => m.codPlanoconta !== codPlanoconta
        )
        // Adiciona nova movimentação
        customizations.movedItems.push({ codPlanoconta, fromGrupo, toGrupo })
        break
      }
      
      case 'unmove': {
        const { codPlanoconta } = body as { action: string; codPlanoconta: string }
        if (!codPlanoconta) {
          return NextResponse.json(
            { error: 'codPlanoconta é obrigatório' },
            { status: 400 }
          )
        }
        customizations.movedItems = customizations.movedItems.filter(
          (m) => m.codPlanoconta !== codPlanoconta
        )
        break
      }
      
      case 'add': {
        const { grupoDestino, descricao, valuesByMonth } = body as {
          action: string
          grupoDestino: string
          descricao: string
          valuesByMonth: Record<string, number>
        }
        if (!grupoDestino || !descricao) {
          return NextResponse.json(
            { error: 'grupoDestino e descricao são obrigatórios' },
            { status: 400 }
          )
        }
        
        // Verificar se já existe um item com mesmo grupo e descrição
        const existingIndex = customizations.addedItems.findIndex(
          item => item.grupoDestino === grupoDestino && 
                  item.descricao.toLowerCase() === descricao.toLowerCase()
        )
        
        if (existingIndex >= 0) {
          // Mesclar os valores dos meses (novos valores sobrescrevem os antigos para o mesmo mês)
          const existingItem = customizations.addedItems[existingIndex]
          existingItem.valuesByMonth = {
            ...existingItem.valuesByMonth,
            ...valuesByMonth
          }
        } else {
          // Criar novo item
          const newItem: AddedItem = {
            id: `added_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            grupoDestino,
            descricao,
            valuesByMonth: valuesByMonth || {},
            createdAt: new Date().toISOString()
          }
          customizations.addedItems.push(newItem)
        }
        break
      }
      
      case 'removeAdded': {
        const { itemId } = body as { action: string; itemId: string }
        if (!itemId) {
          return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 })
        }
        customizations.addedItems = customizations.addedItems.filter(
          (item) => item.id !== itemId
        )
        break
      }
      
      case 'reset': {
        // Reseta todas as customizações
        customizations.excludedItems = []
        customizations.movedItems = []
        customizations.addedItems = []
        break
      }
      
      default:
        return NextResponse.json(
          { error: `Ação desconhecida: ${action}` },
          { status: 400 }
        )
    }
    
    writeCustomizations(customizations)
    
    return NextResponse.json({
      success: true,
      customizations
    })
  } catch (error) {
    console.error('Erro ao salvar customizações:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar customizações' },
      { status: 500 }
    )
  }
}
