import { useFiltros } from '../context/filtros.ts'
import type { Continente } from '../types.ts'

/**
 * Elegir un país desde cualquier gráfica (barras, puntos, mapa): aplica el filtro de país
 * en todo el dashboard (el globo gira hacia él). Otro clic en el mismo país lo quita.
 * Si hay un continente filtrado distinto al del país, cambia el continente también.
 */
export function useSeleccionPais() {
  const { continente, pais, setContinente, setPais } = useFiltros()
  return (iso: string, continentePais: Continente | null) => {
    if (iso === pais) {
      setPais('Todos')
      return
    }
    if (continente !== 'Todos' && continentePais && continentePais !== continente) {
      setContinente(continentePais)
    }
    setPais(iso)
  }
}
