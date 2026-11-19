import { useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { useEsCelular } from '../../hooks/useMedia.ts'
import { colores } from '../../styles/palette.ts'
import type { RegistroPais } from '../../types.ts'
import { topPaises } from '../../utils/calculos.ts'
import { numero } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { estiloTooltip, lineaEje, ticks } from './ejes.ts'
import estilos from './Grafica.module.css'

type Modo = 'total' | 'pc'

/** En per cápita solo entran países con al menos 1 M de habitantes. */
const POBLACION_MINIMA_PC = 1_000_000

/**
 * Ranking de los 10 países que más emiten en el año filtrado.
 * Barras horizontales: comparan categorías con nombres largos.
 */
export function RankingPaises({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais } = useFiltros()
  const esCelular = useEsCelular()
  // En celular los ejes van con letra más grande
  const ejeTicks = esCelular ? { ...ticks, fontSize: 12 } : ticks
  const [modo, setModo] = useState<Modo>('total')

  const campo = modo === 'total' ? 'co2' : 'co2_pc'
  const datos = topPaises(paises, anio, continente, campo, 10, modo === 'pc' ? POBLACION_MINIMA_PC : 0).map(
    (p) => ({ iso: p.iso, nombre: p.pais, valor: p[campo] ?? 0 }),
  )
  const unidad = modo === 'total' ? 'Mt' : 't/hab'

  const selector = (
    <div className={estilos.switch} role="group" aria-label="Medida del ranking">
      {(['total', 'pc'] as const).map((m) => (
        <button
          key={m}
          type="button"
          className={`${estilos.opcion} ${modo === m ? estilos.activa : ''}`}
          onClick={() => setModo(m)}
        >
          {m === 'total' ? 'Total (Mt)' : 'Per cápita (t/hab)'}
        </button>
      ))}
    </div>
  )

  return (
    <Tarjeta titulo="Ranking de países" acciones={selector} className={className}>
      <div className={estilos.grafica}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="nombre"
              width={104}
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: colores.fondo }}
              formatter={(v) => [`${numero(Number(v), modo === 'total' ? 0 : 1)} ${unidad}`, 'CO₂']}
              contentStyle={estiloTooltip}
            />
            <Bar dataKey="valor" radius={[0, 3, 3, 0]} barSize={14} isAnimationActive={false}>
              {datos.map((d) => (
                <Cell key={d.iso} fill={d.iso === pais ? colores.destacado : colores.emision} />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(v) => numero(Number(v), modo === 'total' ? 0 : 1)}
                style={{ fontSize: 11, fill: colores.texto }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {modo === 'pc' && <p className={estilos.nota}>Solo países con más de 1 M de habitantes</p>}
    </Tarjeta>
  )
}
