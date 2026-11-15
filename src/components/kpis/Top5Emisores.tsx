import { useFiltros } from '../../context/filtros.ts'
import type { RegistroPais } from '../../types.ts'
import { topPaises } from '../../utils/calculos.ts'
import { numero } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Kpi.module.css'

/** KPI secundario: los 5 países con más CO₂ total (Mt) en el año y continente filtrados. */
export function Top5Emisores({ paises }: { paises: RegistroPais[] }) {
  const { anio, continente, pais } = useFiltros()
  const top = topPaises(paises, anio, continente, 'co2', 5)
  const maximo = top[0]?.co2 ?? 1

  return (
    <Tarjeta titulo="Top 5 emisores (Mt CO₂)">
      <ol className={estilos.lista}>
        {top.map((p, i) => (
          <li key={p.iso} className={`${estilos.fila} ${p.iso === pais ? estilos.seleccionado : ''}`}>
            <span className={estilos.posicion}>{i + 1}</span>
            <span className={estilos.nombreFila} title={p.pais}>
              {p.pais}
            </span>
            <span className={estilos.pista}>
              <span className={estilos.relleno} style={{ width: `${((p.co2 ?? 0) / maximo) * 100}%` }} />
            </span>
            <span className={estilos.cifra}>{numero(p.co2, 0)}</span>
          </li>
        ))}
      </ol>
    </Tarjeta>
  )
}
