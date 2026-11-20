import { createContext, useContext } from 'react'
import type { Continente } from '../types.ts'

export interface Filtros {
  anio: number
  continente: Continente | 'Todos'
  pais: string // iso del país o 'Todos'
}

export interface ContextoFiltros extends Filtros {
  setAnio: (anio: number) => void
  setContinente: (continente: Filtros['continente']) => void
  setPais: (pais: string) => void
  /** ▶ del encabezado: el dashboard recorre los años solo (el globo anima su relieve). */
  reproduciendo: boolean
  setReproduciendo: (valor: boolean) => void
}

export const FiltrosContext = createContext<ContextoFiltros | null>(null)

/** Filtros globales del encabezado (año, continente, país). */
export function useFiltros(): ContextoFiltros {
  const ctx = useContext(FiltrosContext)
  if (!ctx) throw new Error('useFiltros debe usarse dentro de <FiltrosProvider>')
  return ctx
}
