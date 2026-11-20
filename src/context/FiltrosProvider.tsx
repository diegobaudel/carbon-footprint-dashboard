import { useMemo, useState, type ReactNode } from 'react'
import { ANIO_MAX } from '../types.ts'
import { FiltrosContext, type ContextoFiltros, type Filtros } from './filtros.ts'

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const [anio, setAnio] = useState<number>(ANIO_MAX)
  const [continente, setContinenteEstado] = useState<Filtros['continente']>('Todos')
  const [pais, setPais] = useState<string>('Todos')
  const [reproduciendo, setReproduciendo] = useState(false)

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
      setReproduciendo,
    }),
    [anio, continente, pais, reproduciendo],
  )

  return <FiltrosContext.Provider value={valor}>{children}</FiltrosContext.Provider>
}
