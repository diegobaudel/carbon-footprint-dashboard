import { useEffect, useState } from 'react'
import { cargarAgregados, cargarPaises } from '../services/datos.ts'
import type { RegistroAgregado, RegistroPais } from '../types.ts'

interface EstadoDatos {
  paises: RegistroPais[]
  agregados: RegistroAgregado[]
  cargando: boolean
  error: string | null
}

/** Carga los dos JSON una sola vez al montar el dashboard. */
export function useDatos(): EstadoDatos {
  const [estado, setEstado] = useState<EstadoDatos>({
    paises: [],
    agregados: [],
    cargando: true,
    error: null,
  })

  useEffect(() => {
    let activo = true
    Promise.all([cargarPaises(), cargarAgregados()])
      .then(([paises, agregados]) => {
        if (activo) setEstado({ paises, agregados, cargando: false, error: null })
      })
      .catch((e: unknown) => {
        if (activo) {
          const mensaje = e instanceof Error ? e.message : 'Error al cargar los datos'
          setEstado((prev) => ({ ...prev, cargando: false, error: mensaje }))
        }
      })
    return () => {
      activo = false
    }
  }, [])

  return estado
}
