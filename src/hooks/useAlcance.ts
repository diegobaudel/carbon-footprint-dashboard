import { useMemo } from 'react'
import { useFiltros } from '../context/filtros.ts'
import { serieAgregado, seriePais } from '../utils/calculos.ts'
import type { RegistroAgregado, RegistroPais } from '../types.ts'

export interface PuntoSerie {
  anio: number
  co2: number | null
  co2_pc: number | null
}

export interface Alcance {
  /** Texto para las etiquetas: "promedio mundial", "promedio de Asia" o el país. */
  etiqueta: string
  serie: PuntoSerie[]
}

/**
 * A qué se refieren los KPIs según los filtros:
 * país elegido → ese país; continente elegido → el agregado del continente; si no → Mundo.
 */
export function useAlcance(paises: RegistroPais[], agregados: RegistroAgregado[]): Alcance {
  const { continente, pais } = useFiltros()

  return useMemo(() => {
    const aPunto = (r: RegistroPais | RegistroAgregado): PuntoSerie => ({
      anio: r.anio,
      co2: r.co2,
      co2_pc: r.co2_pc,
    })
    if (pais !== 'Todos') {
      const serie = seriePais(paises, pais)
      return { etiqueta: serie[0]?.pais ?? pais, serie: serie.map(aPunto) }
    }
    if (continente !== 'Todos') {
      return { etiqueta: `promedio de ${continente}`, serie: serieAgregado(agregados, continente).map(aPunto) }
    }
    return { etiqueta: 'promedio mundial', serie: serieAgregado(agregados, 'Mundo').map(aPunto) }
  }, [paises, agregados, continente, pais])
}
