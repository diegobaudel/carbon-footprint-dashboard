import { useFiltros } from '../../context/filtros.ts'
import type { RegistroPais } from '../../types.ts'
import { descargarCSV } from '../../utils/descargas.ts'
import { IconoDescarga } from './Iconos.tsx'

/**
 * "Descargar datos": CSV con la serie 2010–2023 de lo que se está viendo
 * (todos los países, los de un continente o un país). Mismas columnas que paises.json.
 */
export function BotonDescargaDatos({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { continente, pais } = useFiltros()

  function descargar() {
    const filas = paises
      .filter((p) => (pais !== 'Todos' ? p.iso === pais : continente === 'Todos' || p.continente === continente))
      .sort((a, b) => a.pais.localeCompare(b.pais, 'es') || a.anio - b.anio)
      .map((p) => ({
        pais: p.pais,
        iso: p.iso,
        continente: p.continente,
        anio: p.anio,
        poblacion: p.poblacion,
        pib_usd_ppa: p.pib,
        pib_per_capita: p.pib_pc,
        co2_mt: p.co2,
        co2_per_capita_t: p.co2_pc,
        carbon_mt: p.carbon,
        petroleo_mt: p.petroleo,
        gas_mt: p.gas,
        cemento_mt: p.cemento,
        flaring_mt: p.flaring,
        sin_datos_owid: p.sin_datos ? 'sí' : '',
      }))
    const alcance = pais !== 'Todos' ? pais.toLowerCase() : continente !== 'Todos' ? continente : 'mundo'
    descargarCSV(`huella-carbono-${alcance}-2010-2023`, filas)
  }

  return (
    <button
      type="button"
      className={className}
      onClick={descargar}
      title="Descarga en CSV (abre en Excel) los datos 2010–2023 de lo que estás viendo"
    >
      <IconoDescarga />
      Descargar datos
    </button>
  )
}
