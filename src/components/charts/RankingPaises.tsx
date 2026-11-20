import { useState } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { useEsCelular } from '../../hooks/useMedia.ts'
import { DURACION_ENTRADA, useAnimacionEntrada } from '../../hooks/useMovimiento.ts'
import { useSeleccionPais } from '../../hooks/useSeleccionPais.ts'
import { colores } from '../../styles/palette.ts'
import type { RegistroPais } from '../../types.ts'
import { delAnio, delContinente, topPaises } from '../../utils/calculos.ts'
import { numero } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { estiloTooltip, lineaEje, ticks, tituloX } from './ejes.ts'
import estilos from './Grafica.module.css'

type Modo = 'total' | 'pc'
/** Mayores emisores (cabeza del ranking) o menores (cola). */
type Extremo = 'mas' | 'menos'

/**
 * En per cápita, y en la vista de menores emisores, solo entran países con al menos
 * 1 M de habitantes: si no, la lista la llenan islas de pocos miles de personas.
 */
const POBLACION_MINIMA = 1_000_000

/** Cifra con decimales según su tamaño (los menores emisores tienen valores muy chicos). */
function cifra(v: number, modo: Modo): string {
  if (modo === 'total') return numero(v, v < 10 ? 1 : 0)
  return numero(v, v < 0.1 ? 2 : 1)
}

/**
 * Ranking de los 10 países que más (o menos) emiten en el año filtrado.
 * Barras horizontales: comparan categorías con nombres largos.
 */
export function RankingPaises({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais } = useFiltros()
  const esCelular = useEsCelular()
  // La gráfica se dibuja (barras crecen, líneas se trazan) cuando entra en pantalla
  const { ref: refEntrada, visible, animar } = useAnimacionEntrada<HTMLDivElement>()
  const seleccionar = useSeleccionPais()
  // En celular los ejes van con letra más grande
  const ejeTicks = esCelular ? { ...ticks, fontSize: 12 } : ticks
  const [modo, setModo] = useState<Modo>('total')
  const [extremo, setExtremo] = useState<Extremo>('mas')

  const campo = modo === 'total' ? 'co2' : 'co2_pc'
  const filas =
    extremo === 'mas'
      ? topPaises(paises, anio, continente, campo, 10, modo === 'pc' ? POBLACION_MINIMA : 0)
      : delContinente(delAnio(paises, anio), continente)
          .filter((p) => p[campo] != null && (p.poblacion ?? 0) >= POBLACION_MINIMA)
          .sort((a, b) => (a[campo] ?? 0) - (b[campo] ?? 0))
          .slice(0, 10)
  const datos = filas.map((p) => ({ iso: p.iso, nombre: p.pais, continente: p.continente, valor: p[campo] ?? 0 }))
  const unidad = modo === 'total' ? 'Mt' : 't/hab'

  const selector = (
    <>
      <div className={estilos.switch} role="group" aria-label="Mayores o menores emisores">
        {(['mas', 'menos'] as const).map((e) => (
          <button
            key={e}
            type="button"
            className={`${estilos.opcion} ${extremo === e ? estilos.activa : ''}`}
            onClick={() => setExtremo(e)}
            aria-pressed={extremo === e}
          >
            {e === 'mas' ? 'Más emiten' : 'Menos emiten'}
          </button>
        ))}
      </div>
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
    </>
  )

  return (
    <Tarjeta
      titulo={extremo === 'mas' ? 'Ranking de países' : 'Ranking de países · menores emisores'}
      acciones={selector}
      className={className}
      descarga={{
        nombre: `ranking-paises-${extremo === 'mas' ? 'mayores' : 'menores'}-${modo === 'total' ? 'total' : 'per-capita'}-${anio}`,
        imagen: true,
        filas: () =>
          datos.map((d, i) => ({ lugar: i + 1, pais: d.nombre, iso: d.iso, anio, [`co2_${unidad.replace('/', '_')}`]: d.valor })),
      }}
    >
      <div ref={refEntrada} className={estilos.grafica}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visible ? datos : []} layout="vertical" margin={{ top: 0, right: 44, bottom: 18, left: 0 }}>
            <XAxis
              type="number"
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              tickFormatter={(v) => cifra(Number(v), modo)}
              label={tituloX(modo === 'total' ? 'CO₂ total (Mt)' : 'CO₂ por persona (t/hab)')}
            />
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
              formatter={(v) => [`${cifra(Number(v), modo)} ${unidad}`, 'CO₂']}
              contentStyle={estiloTooltip}
            />
            {/* Clic en una barra: elige ese país en todo el dashboard (el globo gira hacia él) */}
            <Bar
              dataKey="valor"
              radius={[0, 3, 3, 0]}
              barSize={14}
              isAnimationActive={animar}
              animationDuration={DURACION_ENTRADA}
              cursor="pointer"
              onClick={(d) => {
                const fila = d.payload as (typeof datos)[number]
                seleccionar(fila.iso, fila.continente)
              }}
            >
              {datos.map((d) => (
                <Cell key={d.iso} fill={d.iso === pais ? colores.destacado : colores.emision} />
              ))}
              <LabelList
                dataKey="valor"
                position="right"
                formatter={(v) => cifra(Number(v), modo)}
                style={{ fontSize: 11, fill: colores.texto }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {(modo === 'pc' || extremo === 'menos') && <p className={estilos.nota}>Solo países con más de 1 M de habitantes</p>}
    </Tarjeta>
  )
}
