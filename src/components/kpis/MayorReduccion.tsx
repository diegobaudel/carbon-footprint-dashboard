import { useFiltros } from '../../context/filtros.ts'
import type { RegistroPais } from '../../types.ts'
import { ANIO_MIN } from '../../types.ts'
import { mayorReduccion } from '../../utils/calculos.ts'
import { porcentaje } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Kpi.module.css'

const UMBRAL_MT = 10

/** KPI secundario: país con mayor reducción relativa de CO₂ entre 2010 y el año filtrado. */
export function MayorReduccion({ paises }: { paises: RegistroPais[] }) {
  const { anio, continente } = useFiltros()
  const resultado = mayorReduccion(paises, anio, continente, UMBRAL_MT)

  return (
    <Tarjeta titulo="Mayor reducción relativa">
      {resultado ? (
        <>
          <p className={estilos.nombrePais} title={resultado.pais.pais}>
            {resultado.pais.pais}
          </p>
          <p className={`${estilos.valor} ${resultado.cambio < 0 ? estilos.mejora : estilos.aumento}`}>
            {porcentaje(resultado.cambio)}
          </p>
        </>
      ) : (
        <p className={estilos.etiqueta}>Elige un año posterior a {ANIO_MIN} para comparar.</p>
      )}
      <p className={estilos.notaLinea}>
        Países con más de {UMBRAL_MT} Mt en {ANIO_MIN} · {ANIO_MIN}→{anio}
      </p>
    </Tarjeta>
  )
}
