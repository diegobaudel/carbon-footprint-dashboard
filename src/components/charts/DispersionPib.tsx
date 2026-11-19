import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { useEsCelular } from '../../hooks/useMedia.ts'
import { colores } from '../../styles/palette.ts'
import { ANIO_MAX_PIB, type RegistroPais } from '../../types.ts'
import { delAnio, delContinente } from '../../utils/calculos.ts'
import { dolares, numero, poblacion } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { lineaEje, ticks } from './ejes.ts'
import estilos from './Grafica.module.css'

/** Marcas de los ejes logarítmicos (USD PPA y t/hab). */
const MARCAS_PIB = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]
const MARCAS_CO2 = [0.03, 0.1, 0.3, 1, 3, 10, 30]

interface Punto {
  iso: string
  nombre: string
  pib_pc: number
  co2_pc: number
  poblacion: number
}

function TooltipPunto({ active, payload }: { active?: boolean; payload?: { payload: Punto }[] }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  return (
    <div className={estilos.tooltip}>
      <strong>{p.nombre}</strong>
      <br />
      PIB per cápita: {dolares(p.pib_pc)}
      <br />
      CO₂ per cápita: {numero(p.co2_pc, 1)} t
      <br />
      Población: {poblacion(p.poblacion)}
    </div>
  )
}

/**
 * Relación entre PIB per cápita y CO₂ per cápita. Dispersión: relación entre dos variables.
 * Ejes logarítmicos porque ambos valores cubren varios órdenes de magnitud.
 * OWID no tiene PIB de 2023: con ese año se usa el PIB de 2022.
 */
export function DispersionPib({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais } = useFiltros()
  const esCelular = useEsCelular()
  // En celular los ejes van con letra más grande
  const ejeTicks = esCelular ? { ...ticks, fontSize: 12 } : ticks
  const anioPib = Math.min(anio, ANIO_MAX_PIB)

  const datos: Punto[] = delContinente(delAnio(paises, anioPib), continente)
    .filter((p) => p.en_dispersion && (p.pib_pc ?? 0) > 0 && (p.co2_pc ?? 0) > 0)
    .map((p) => ({
      iso: p.iso,
      nombre: p.pais,
      pib_pc: p.pib_pc as number,
      co2_pc: p.co2_pc as number,
      poblacion: p.poblacion,
    }))

  const subtitulo = `Tamaño = población · Escala logarítmica${anio > ANIO_MAX_PIB ? ` · PIB de ${ANIO_MAX_PIB}` : ''}`

  return (
    <Tarjeta titulo="PIB per cápita vs CO₂ per cápita" subtitulo={subtitulo} className={className}>
      <div className={estilos.grafica}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={colores.borde} />
            <XAxis
              type="number"
              dataKey="pib_pc"
              name="PIB per cápita"
              scale="log"
              domain={[500, 170000]}
              ticks={MARCAS_PIB}
              allowDataOverflow
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              tickFormatter={(v) => dolares(Number(v))}
              label={{ value: 'PIB per cápita (USD PPA)', position: 'insideBottomRight', offset: -2, fontSize: 11, fill: colores.textoSec }}
            />
            <YAxis
              type="number"
              dataKey="co2_pc"
              name="CO₂ per cápita"
              scale="log"
              domain={[0.02, 60]}
              ticks={MARCAS_CO2}
              allowDataOverflow
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              width={40}
              tickFormatter={(v) => numero(Number(v), Number(v) < 0.1 ? 2 : Number(v) < 1 ? 1 : 0)}
            />
            <ZAxis type="number" dataKey="poblacion" range={[20, 900]} />
            <Tooltip content={<TooltipPunto />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={datos} isAnimationActive={false}>
              {datos.map((d) => (
                <Cell
                  key={d.iso}
                  fill={d.iso === pais ? colores.texto : colores.emision}
                  fillOpacity={d.iso === pais ? 0.9 : 0.5}
                  stroke={d.iso === pais ? colores.texto : colores.emision}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  )
}
