import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ANIO_MAX, ANIO_MIN } from '../types.ts'
import { FiltrosContext, type ContextoFiltros, type Filtros } from './filtros.ts'

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const [anio, setAnio] = useState<number>(ANIO_MAX)
  const [continente, setContinenteEstado] = useState<Filtros['continente']>('Todos')
  const [pais, setPais] = useState<string>('Todos')
  const [reproduciendo, setReproduciendo] = useState(false)
  // Cuenta cada vez que se pide ▶ (el encabezado la usa para mover su año al de inicio)
  const [solicitudReproduccion, setSolicitudReproduccion] = useState(0)
  // Año en que la persona pausó; si vuelve a dar ▶ sigue desde ahí
  const pausadoEn = useRef<number | null>(null)

  const valor = useMemo<ContextoFiltros>(
    () => ({
      anio,
      continente,
      pais,
      setAnio,
      // Al cambiar de continente se limpia el país para no dejar uno de otro continente
      setContinente: (c) => {
        setContinenteEstado(c)
        setPais('Todos')
      },
      setPais,
      reproduciendo,
      solicitudReproduccion,
      // ▶ es independiente de los filtros: vuelve a la vista global (todos los países y
      // continentes) y recorre la serie desde 2010, o desde donde se pausó
      reproducir: () => {
        const inicio = pausadoEn.current === anio && anio < ANIO_MAX ? anio : ANIO_MIN
        pausadoEn.current = null
        setContinenteEstado('Todos')
        setPais('Todos')
        setAnio(inicio)
        setSolicitudReproduccion((n) => n + 1)
        setReproduciendo(true)
      },
      pausar: () => {
        pausadoEn.current = anio
        setReproduciendo(false)
      },
      // Termina la serie o la persona mueve el año a mano: no hay nada que reanudar
      detener: () => {
        pausadoEn.current = null
        setReproduciendo(false)
      },
    }),
    [anio, continente, pais, reproduciendo, solicitudReproduccion],
  )

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>
}
