import { Area, AreaChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import type { Alcance } from '../../hooks/useAlcance.ts'
import { colores } from '../../styles/palette.ts'
import { estiloTooltip } from '../charts/ejes.ts'
import { ANIO_MIN } from '../../types.ts'
import { cambioPct } from '../../utils/calculos.ts'
import { numero, porcentaje } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Kpi.module.css'

interface Props {
  alcance: Alcance
  className?: string
}

/**
 * KPI principal (nivel 1): CO₂ per cápita del año filtrado.
 * Para el mundo y los continentes es el promedio ponderado por población
 * (CO₂ total / población total, como lo publica OWID).
 */
export function KpiPrincipal({ alcance, className }: Props) {
  const { anio } = useFiltros()
  const actual = alcance.serie.find((p) => p.anio === anio)
  const inicial = alcance.serie.find((p) => p.anio === ANIO_MIN)
  const delta = cambioPct(inicial?.co2_pc, actual?.co2_pc)
  const baja = delta != null && delta < 0

  return (
    <Tarjeta className={`${estilos.principal} ${className ?? ''}`}>
      <p className={estilos.etiquetaFuerte}>CO₂ per cápita</p>
      <p className={estilos.etiquetaSec}>({alcance.etiqueta})</p>
      <div className={estilos.filaValor}>
        <span key={`${alcance.etiqueta}-${anio}`} className={`${estilos.valorPrincipal} ${estilos.destello}`}>
          {numero(actual?.co2_pc, 1)}
        </span>
        <span className={estilos.unidadFuerte}>t CO₂/hab</span>
      </div>
      <p className={estilos.delta}>
        {anio === ANIO_MIN ? (
          'Año base de la serie'
        ) : (
          <>
            <span className={baja ? estilos.mejora : estilos.aumento}>
              {baja ? '▼' : '▲'} {porcentaje(delta)}
            </span>{' '}
            vs {ANIO_MIN}
          </>
        )}
      </p>
      <div className={estilos.sparkline}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={alcance.serie} margin={{ top: 6, right: 6, bottom: 2, left: 6 }}>
            <defs>
              <linearGradient id="degradadoSparkline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colores.emision} stopOpacity={0.22} />
                <stop offset="100%" stopColor={colores.emision} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="anio" type="number" domain={['dataMin', 'dataMax']} hide />
            <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
            <Tooltip
              cursor={false}
              formatter={(v) => [`${numero(Number(v), 2)} t/hab`, 'CO₂ per cápita']}
              labelFormatter={(_, datos) => datos?.[0]?.payload?.anio ?? ''}
              contentStyle={estiloTooltip}
            />
            <Area
              type="monotone"
              dataKey="co2_pc"
              stroke={colores.emision}
              strokeWidth={2}
              fill="url(#degradadoSparkline)"
              dot={{ r: 2, fill: colores.emision, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            {actual?.co2_pc != null && (
              <ReferenceDot x={anio} y={actual.co2_pc} r={4} fill={colores.texto} stroke={colores.tarjeta} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  )
}
