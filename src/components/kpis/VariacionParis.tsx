import type { Alcance } from '../../hooks/useAlcance.ts'
import { cambioPct } from '../../utils/calculos.ts'
import { porcentaje } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Kpi.module.css'

const PERIODOS = [
  [2010, 2015],
  [2015, 2023],
] as const

/**
 * KPI secundario: variación % del CO₂ total antes (2010–2015) y después (2015–2023)
 * del Acuerdo de París. Periodos fijos: no dependen del deslizador de año.
 */
export function VariacionParis({ alcance }: { alcance: Alcance }) {
  const co2 = (anio: number) => alcance.serie.find((p) => p.anio === anio)?.co2

  return (
    <Tarjeta titulo="Variación % de emisiones">
      <div className={estilos.parGrande}>
        {PERIODOS.map(([inicio, fin]) => {
          const cambio = cambioPct(co2(inicio), co2(fin))
          return (
            <div key={inicio}>
              <p className={estilos.etiqueta}>
                {inicio}–{fin}
              </p>
              <p className={`${estilos.valor} ${cambio != null && cambio < 0 ? estilos.mejora : ''}`}>
                {porcentaje(cambio)}
              </p>
            </div>
          )
        })}
      </div>
      <p className={estilos.notaLinea}>Antes / después del Acuerdo de París · {alcance.etiqueta}</p>
    </Tarjeta>
  )
}
