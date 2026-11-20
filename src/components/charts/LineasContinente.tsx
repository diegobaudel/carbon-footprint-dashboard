import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  useXAxisScale,
  useYAxisScale,
} from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { useEsCelular } from '../../hooks/useMedia.ts'
import { DURACION_ENTRADA, useAnimacionEntrada } from '../../hooks/useMovimiento.ts'
import { colores, tonosSeries } from '../../styles/palette.ts'
import { CONTINENTES, type RegistroAgregado } from '../../types.ts'
import { numero } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { estiloTooltip, lineaEje, ticks, tituloX, tituloY } from './ejes.ts'
import estilos from './Grafica.module.css'

/** Trazos para distinguir las líneas sin depender solo del color (accesibilidad). */
const TRAZOS = ['', '6 4', '2 3', '', '6 4', '2 3']

/** Separación mínima entre etiquetas finales, en px. */
const SEPARACION = 13

interface Etiqueta {
  nombre: string
  valor: number
  color: string
  atenuada: boolean
}

/**
 * Etiquetas directas al final de cada línea. Se calculan juntas para separarlas
 * cuando dos continentes terminan muy cerca (África, Sudamérica y Oceanía).
 */
function EtiquetasFinales({ anio, etiquetas }: { anio: number; etiquetas: Etiqueta[] }) {
  const escalaX = useXAxisScale()
  const escalaY = useYAxisScale()
  if (!escalaX || !escalaY) return null

  const x = Number(escalaX(anio)) + 6
  const posiciones = etiquetas
    .map((e) => ({ ...e, y: Number(escalaY(e.valor)) }))
    .sort((a, b) => b.y - a.y) // de abajo hacia arriba
  for (let i = 1; i < posiciones.length; i++) {
    posiciones[i].y = Math.min(posiciones[i].y, posiciones[i - 1].y - SEPARACION)
  }

  return (
    <g>
      {posiciones.map((e) => (
        <text key={e.nombre} x={x} y={e.y} dy={4} fontSize={11} fill={e.color} opacity={e.atenuada ? 0.35 : 1}>
          {e.nombre}
        </text>
      ))}
    </g>
  )
}

/**
 * Emisiones totales por continente, 2010–2023. Línea: tendencia en el tiempo.
 * La línea vertical en 2015 marca el Acuerdo de París.
 */
export function LineasContinente({
  agregados,
  className,
}: {
  agregados: RegistroAgregado[]
  className?: string
}) {
  const { anio, continente } = useFiltros()
  const esCelular = useEsCelular()
  // La gráfica se dibuja (barras crecen, líneas se trazan) cuando entra en pantalla
  const { ref: refEntrada, visible, animar } = useAnimacionEntrada<HTMLDivElement>()
  // En celular los ejes van con letra más grande
  const ejeTicks = esCelular ? { ...ticks, fontSize: 12 } : ticks

  // De filas (continente, año) a una fila por año con una columna por continente
  const porAnio = new Map<number, Record<string, number>>()
  for (const a of agregados) {
    if (!(CONTINENTES as readonly string[]).includes(a.nombre) || a.co2 == null) continue
    const fila = porAnio.get(a.anio) ?? { anio: a.anio }
    fila[a.nombre] = a.co2
    porAnio.set(a.anio, fila)
  }
  const datos = [...porAnio.values()].sort((a, b) => a.anio - b.anio)
  const final = datos[datos.length - 1]
  const filaAnio = datos.find((d) => d.anio === anio)
  const etiquetas: Etiqueta[] = final
    ? CONTINENTES.filter((c) => final[c] != null).map((c) => ({
        nombre: c,
        valor: final[c],
        color: tonosSeries[CONTINENTES.indexOf(c)],
        atenuada: continente !== 'Todos' && continente !== c,
      }))
    : []

  return (
    <Tarjeta
      titulo="Emisiones por continente, 2010–2023"
      subtitulo="Mt CO₂"
      className={className}
      descarga={{
        nombre: 'emisiones-por-continente-2010-2023',
        imagen: true,
        filas: () => datos.map((d) => ({ anio: d.anio, ...Object.fromEntries(CONTINENTES.map((c) => [`${c} (Mt)`, d[c] ?? null])) })),
      }}
    >
      <div ref={refEntrada} className={estilos.grafica}>
        <ResponsiveContainer width="100%" height="100%">
          {/* En celular las etiquetas al final de cada línea se cambian por una leyenda abajo */}
          <LineChart data={visible ? datos : []} margin={{ top: 16, right: esCelular ? 12 : 92, bottom: 18, left: 10 }}>
            <CartesianGrid vertical={false} stroke={colores.borde} />
            <XAxis dataKey="anio" tick={ejeTicks} axisLine={lineaEje} tickLine={false} label={tituloX('Año')} />
            <YAxis
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              width={68}
              tickFormatter={(v) => numero(Number(v), 0)}
              label={tituloY('CO₂ (Mt)')}
            />
            <Tooltip formatter={(v) => `${numero(Number(v), 0)} Mt`} contentStyle={estiloTooltip} />
            <ReferenceLine
              x={2015}
              stroke={colores.textoSec}
              strokeDasharray="4 4"
              label={{ value: 'Acuerdo de París', position: 'top', fontSize: 11, fill: colores.textoSec }}
            />
            {CONTINENTES.map((c, i) => {
              const atenuada = continente !== 'Todos' && continente !== c
              return (
                <Line
                  key={c}
                  dataKey={c}
                  type="monotone"
                  stroke={tonosSeries[i]}
                  strokeWidth={continente === c ? 3 : 2}
                  strokeDasharray={TRAZOS[i]}
                  strokeOpacity={atenuada ? 0.25 : 1}
                  dot={false}
                  isAnimationActive={animar}
                  animationDuration={DURACION_ENTRADA}
                />
              )
            })}
            {/* Año elegido en el filtro: línea y un punto por continente */}
            <ReferenceLine x={anio} stroke={colores.emision} strokeWidth={1.5} />
            {filaAnio &&
              CONTINENTES.map((c, i) =>
                filaAnio[c] != null ? (
                  <ReferenceDot
                    key={c}
                    x={anio}
                    y={filaAnio[c]}
                    r={3.5}
                    fill={tonosSeries[i]}
                    stroke={colores.tarjeta}
                    ifOverflow="visible"
                  />
                ) : null,
              )}
            {final && !esCelular && <EtiquetasFinales anio={final.anio} etiquetas={etiquetas} />}
            {esCelular && (
              <Legend
                verticalAlign="bottom"
                iconType="plainline"
                iconSize={14}
                wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                formatter={(nombre) => <span style={{ color: colores.textoSec }}>{nombre}</span>}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  )
}
