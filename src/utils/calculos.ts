/**
 * Cálculos de KPIs y series. Son funciones puras: reciben los datos ya limpios
 * (public/data/*.json) y los filtros, y regresan lo que pinta cada componente.
 */
import type { Continente, RegistroAgregado, RegistroPais } from '../types.ts'
import { ANIO_MIN } from '../types.ts'

export type FiltroContinente = Continente | 'Todos'

/** Cambio porcentual de `inicio` a `fin`. */
export function cambioPct(inicio: number | null | undefined, fin: number | null | undefined): number | null {
  if (inicio == null || fin == null || inicio === 0) return null
  return ((fin - inicio) / inicio) * 100
}

export function delContinente(paises: RegistroPais[], continente: FiltroContinente): RegistroPais[] {
  return continente === 'Todos' ? paises : paises.filter((p) => p.continente === continente)
}

export function delAnio(paises: RegistroPais[], anio: number): RegistroPais[] {
  return paises.filter((p) => p.anio === anio)
}

/** Serie 2010–2023 de un agregado (Mundo o un continente), ordenada por año. */
export function serieAgregado(agregados: RegistroAgregado[], nombre: string): RegistroAgregado[] {
  return agregados.filter((a) => a.nombre === nombre).sort((a, b) => a.anio - b.anio)
}

/** Serie 2010–2023 de un país, ordenada por año. */
export function seriePais(paises: RegistroPais[], iso: string): RegistroPais[] {
  return paises.filter((p) => p.iso === iso).sort((a, b) => a.anio - b.anio)
}

/**
 * Los `n` países con mayor valor de `campo` en el año.
 * Para el ranking per cápita se exige una población mínima, para que no lo
 * dominen territorios muy pequeños (ej. islas con pocos miles de habitantes).
 */
export function topPaises(
  paises: RegistroPais[],
  anio: number,
  continente: FiltroContinente,
  campo: 'co2' | 'co2_pc',
  n: number,
  poblacionMinima = 0,
): RegistroPais[] {
  return delContinente(delAnio(paises, anio), continente)
    .filter((p) => p[campo] != null && (p.poblacion ?? 0) >= poblacionMinima)
    .sort((a, b) => (b[campo] ?? 0) - (a[campo] ?? 0))
    .slice(0, n)
}

export interface Reduccion {
  pais: RegistroPais
  cambio: number
}

/**
 * País con mayor reducción relativa de CO₂ total entre 2010 y `anio`,
 * entre los que emitían más de `umbralMt` en 2010.
 */
export function mayorReduccion(
  paises: RegistroPais[],
  anio: number,
  continente: FiltroContinente,
  umbralMt = 10,
): Reduccion | null {
  if (anio <= ANIO_MIN) return null
  const base = new Map(
    delContinente(delAnio(paises, ANIO_MIN), continente)
      .filter((p) => (p.co2 ?? 0) > umbralMt)
      .map((p) => [p.iso, p.co2 as number]),
  )
  let mejor: Reduccion | null = null
  for (const p of delAnio(paises, anio)) {
    const inicio = base.get(p.iso)
    const cambio = cambioPct(inicio, p.co2)
    if (cambio != null && (mejor == null || cambio < mejor.cambio)) mejor = { pais: p, cambio }
  }
  return mejor
}
