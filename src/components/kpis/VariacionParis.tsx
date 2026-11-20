import { useFiltros } from '../../context/filtros.ts'
import type { Alcance } from '../../hooks/useAlcance.ts'
import { ANIO_MIN } from '../../types.ts'
import { cambioPct } from '../../utils/calculos.ts'
import { porcentaje } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { NumeroAnimado } from '../layout/NumeroAnimado.tsx'
import estilos from './Kpi.module.css'

const ANIO_PARIS = 2015

/**
 * KPI secundario: variación % del CO₂ total antes y después del Acuerdo de París.
 * Antes: 2010 → 2015 (o al año elegido si es anterior a 2015).
 * Después: 2015 → año elegido, así el KPI responde al deslizador.
 */
export function VariacionParis({ alcance }: { alcance: Alcance }) {
  const { anio } = useFiltros()
  const co2 = (a: number) => alcance.serie.find((p) => p.anio === a)?.co2
  const periodos: (readonly [number, number] | null)[] = [
    [ANIO_MIN, Math.min(anio, ANIO_PARIS)],
    anio > ANIO_PARIS ? [ANIO_PARIS, anio] : null,
  ]

  return (
    <Tarjeta titulo="Variación % de emisiones">
      <div className={estilos.parGrande}>
        {periodos.map((periodo, i) => {
          if (!periodo || periodo[0] === periodo[1]) {
            return (
              <div key={i}>
                <p className={estilos.etiqueta}>{i === 0 ? 'Antes de París' : `${ANIO_PARIS}–…`}</p>
                <p className={estilos.etiqueta}>Elige un año {i === 0 ? `después de ${ANIO_MIN}` : `después de ${ANIO_PARIS}`}</p>
              </div>
            )
          }
          const [inicio, fin] = periodo
          const cambio = cambioPct(co2(inicio), co2(fin))
          return (
            <div key={i}>
              <p className={estilos.etiqueta}>
                {inicio}–{fin}
              </p>
              <p className={`${estilos.valor} ${cambio != null && cambio < 0 ? estilos.mejora : ''}`}>
                <NumeroAnimado valor={cambio} formato={porcentaje} />
              </p>
            </div>
          )
        })}
      </div>
      <p className={estilos.notaLinea}>Antes / después del Acuerdo de París · {alcance.etiqueta}</p>
    </Tarjeta>
  )
}
