import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { colores, coloresFuente } from '../../styles/palette.ts'
import type { RegistroPais } from '../../types.ts'
import { topPaises } from '../../utils/calculos.ts'
import { numero } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { estiloTooltip, lineaEje, ticks } from './ejes.ts'
import estilos from './Grafica.module.css'

const FUENTES = [
  { clave: 'carbon', nombre: 'Carbón' },
  { clave: 'petroleo', nombre: 'Petróleo' },
  { clave: 'gas', nombre: 'Gas' },
  { clave: 'cemento', nombre: 'Cemento' },
  { clave: 'flaring', nombre: 'Flaring' },
] as const

/**
 * Composición del CO₂ por fuente en los 5 mayores emisores del año.
 * Barras apiladas: comparan países y muestran de qué está hecho cada total.
 * Si hay un país elegido fuera del top 5, toma el quinto lugar.
 */
export function BarrasFuente({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais } = useFiltros()

  let seleccion = topPaises(paises, anio, continente, 'co2', 5)
  if (pais !== 'Todos' && !seleccion.some((p) => p.iso === pais)) {
    const elegido = paises.find((p) => p.iso === pais && p.anio === anio)
    if (elegido) seleccion = [...seleccion.slice(0, 4), elegido]
  }

  const datos = seleccion.map((p) => ({
    nombre: p.pais,
    carbon: p.carbon ?? 0,
    petroleo: p.petroleo ?? 0,
    gas: p.gas ?? 0,
    cemento: p.cemento ?? 0,
    flaring: p.flaring ?? 0,
  }))

  return (
    <Tarjeta titulo="Emisiones por fuente" subtitulo={`Mt CO₂ · ${anio}`} className={className}>
      <div className={estilos.grafica}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid horizontal={false} stroke={colores.borde} />
            <XAxis
              type="number"
              tick={ticks}
              axisLine={lineaEje}
              tickLine={false}
              tickFormatter={(v) => numero(Number(v), 0)}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={110}
              tick={ticks}
              axisLine={lineaEje}
              tickLine={false}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: colores.fondo }}
              formatter={(v) => `${numero(Number(v), 0)} Mt`}
              contentStyle={estiloTooltip}
            />
            <Legend
              verticalAlign="top"
              align="left"
              iconType="square"
              iconSize={10}
              itemSorter={null}
              formatter={(nombre) => <span style={{ color: colores.textoSec }}>{nombre}</span>}
              wrapperStyle={{ fontSize: 12, color: colores.textoSec, paddingBottom: 6 }}
            />
            {FUENTES.map((f) => (
              <Bar
                key={f.clave}
                dataKey={f.clave}
                name={f.nombre}
                stackId="fuentes"
                fill={coloresFuente[f.clave]}
                barSize={16}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  )
}
