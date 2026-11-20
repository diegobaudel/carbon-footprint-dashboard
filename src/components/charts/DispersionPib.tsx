import { useEffect, useRef, useState } from 'react'
import {
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  usePlotArea,
  useXAxisInverseScale,
  useYAxisInverseScale,
} from 'recharts'
import { useFiltros } from '../../context/filtros.ts'
import { useEsCelular } from '../../hooks/useMedia.ts'
import { DURACION_ENTRADA, useAnimacionEntrada } from '../../hooks/useMovimiento.ts'
import { useSeleccionPais } from '../../hooks/useSeleccionPais.ts'
import { colores } from '../../styles/palette.ts'
import { ANIO_MAX_PIB, type RegistroPais } from '../../types.ts'
import { delAnio, delContinente } from '../../utils/calculos.ts'
import { dolares, numero, poblacion } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { lineaEje, ticks, tituloY } from './ejes.ts'
import estilos from './Grafica.module.css'

/** Rango completo de los ejes logarítmicos (USD PPA y t/hab). */
const COMPLETO = { x: [500, 170000] as Rango, y: [0.02, 60] as Rango }
type Rango = [number, number]
interface Dominio {
  x: Rango
  y: Rango
}

/**
 * Marcas para un eje logarítmico entre min y max: la serie más densa que quepa (máx. 8),
 * así al hacer zoom siempre hay marcas legibles y en la vista completa no se amontonan.
 */
function marcasLog(min: number, max: number): number[] {
  for (const pasos of [[1, 1.5, 2, 3, 5, 7], [1, 2, 5], [1, 3], [1]]) {
    const marcas: number[] = []
    for (let e = Math.floor(Math.log10(min)) - 1; e <= Math.ceil(Math.log10(max)); e++) {
      for (const p of pasos) {
        const v = Number((p * 10 ** e).toPrecision(3))
        if (v >= min && v <= max) marcas.push(v)
      }
    }
    if (marcas.length <= 8) return marcas.length >= 2 ? marcas : [min, max]
  }
  return [min, max]
}

/** Acerca (factor < 1) o aleja (factor > 1) un rango logarítmico alrededor de `centro`. */
function escalarRango([a, b]: Rango, factor: number, centro: number, limite: Rango): Rango {
  const la = Math.log10(a)
  const lb = Math.log10(b)
  const lc = Math.log10(centro)
  let ini = lc - (lc - la) * factor
  let fin = lc + (lb - lc) * factor
  const [lmin, lmax] = [Math.log10(limite[0]), Math.log10(limite[1])]
  if (fin - ini >= (lmax - lmin) * 0.98) return limite
  if (ini < lmin) [ini, fin] = [lmin, fin + (lmin - ini)]
  if (fin > lmax) [ini, fin] = [ini - (fin - lmax), lmax]
  return [10 ** ini, 10 ** fin]
}

/**
 * Zoom por arrastre: al arrastrar sobre una zona vacía de la gráfica se dibuja un
 * rectángulo y, al soltar, la gráfica se acerca a esa zona. Escucha los eventos en el
 * SVG completo y los ignora si empiezan sobre un punto, así el clic y el tooltip de cada
 * país siguen funcionando.
 */
function ZonaArrastre({ onZoom }: { onZoom: (d: Dominio) => void }) {
  const area = usePlotArea()
  const invX = useXAxisInverseScale()
  const invY = useYAxisInverseScale()
  const capa = useRef<SVGGElement>(null)
  const [caja, setCaja] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const actual = useRef({ area, invX, invY, onZoom })
  useEffect(() => {
    actual.current = { area, invX, invY, onZoom }
  })

  useEffect(() => {
    const svg = capa.current?.ownerSVGElement
    if (!svg) return
    let inicio: { x: number; y: number } | null = null
    let fin: { x: number; y: number } | null = null
    const punto = (e: PointerEvent) => {
      const a = actual.current.area
      const r = svg.getBoundingClientRect()
      if (!a) return null
      return {
        x: Math.min(a.x + a.width, Math.max(a.x, e.clientX - r.left)),
        y: Math.min(a.y + a.height, Math.max(a.y, e.clientY - r.top)),
      }
    }
    const abajo = (e: PointerEvent) => {
      const a = actual.current.area
      if (!a || (e.target as Element).closest('.recharts-scatter-symbol')) return
      const r = svg.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < a.x || x > a.x + a.width || y < a.y || y > a.y + a.height) return
      inicio = { x, y }
      fin = inicio
      svg.setPointerCapture(e.pointerId)
      setCaja({ x0: x, y0: y, x1: x, y1: y })
    }
    const mueve = (e: PointerEvent) => {
      if (!inicio) return
      fin = punto(e)
      if (fin) setCaja({ x0: inicio.x, y0: inicio.y, x1: fin.x, y1: fin.y })
    }
    const arriba = () => {
      const { invX: ix, invY: iy, onZoom: zoom } = actual.current
      if (inicio && fin && ix && iy && Math.abs(fin.x - inicio.x) > 12 && Math.abs(fin.y - inicio.y) > 12) {
        const xs = [Number(ix(inicio.x)), Number(ix(fin.x))].sort((a, b) => a - b) as Rango
        const ys = [Number(iy(inicio.y)), Number(iy(fin.y))].sort((a, b) => a - b) as Rango
        zoom({ x: xs, y: ys })
      }
      inicio = null
      fin = null
      setCaja(null)
    }
    svg.addEventListener('pointerdown', abajo)
    svg.addEventListener('pointermove', mueve)
    svg.addEventListener('pointerup', arriba)
    svg.addEventListener('pointercancel', arriba)
    return () => {
      svg.removeEventListener('pointerdown', abajo)
      svg.removeEventListener('pointermove', mueve)
      svg.removeEventListener('pointerup', arriba)
      svg.removeEventListener('pointercancel', arriba)
    }
  }, [])

  return (
    <g ref={capa}>
      {caja && (
        <rect
          x={Math.min(caja.x0, caja.x1)}
          y={Math.min(caja.y0, caja.y1)}
          width={Math.abs(caja.x1 - caja.x0)}
          height={Math.abs(caja.y1 - caja.y0)}
          fill={colores.emision}
          fillOpacity={0.12}
          stroke={colores.emision}
          strokeDasharray="4 3"
          pointerEvents="none"
        />
      )}
    </g>
  )
}

interface Punto {
  iso: string
  continente: RegistroPais['continente']
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
  // La gráfica se dibuja (barras crecen, líneas se trazan) cuando entra en pantalla
  const { ref: refEntrada, visible, animar } = useAnimacionEntrada<HTMLDivElement>()
  const seleccionar = useSeleccionPais()
  // En celular los ejes van con letra más grande
  const ejeTicks = esCelular ? { ...ticks, fontSize: 12 } : ticks
  const anioPib = Math.min(anio, ANIO_MAX_PIB)
  // Zoom: null = vista completa. Se mantiene al cambiar de año (sirve con ▶)
  const [zoom, setZoom] = useState<Dominio | null>(null)
  const dominio = zoom ?? COMPLETO

  const datos: Punto[] = delContinente(delAnio(paises, anioPib), continente)
    .filter((p) => p.en_dispersion && (p.pib_pc ?? 0) > 0 && (p.co2_pc ?? 0) > 0)
    .map((p) => ({
      iso: p.iso,
      continente: p.continente,
      nombre: p.pais,
      pib_pc: p.pib_pc as number,
      co2_pc: p.co2_pc as number,
      poblacion: p.poblacion ?? 0, // en_dispersion ya excluye a los territorios sin datos
    }))

  const enVista = datos.filter(
    (d) => d.pib_pc >= dominio.x[0] && d.pib_pc <= dominio.x[1] && d.co2_pc >= dominio.y[0] && d.co2_pc <= dominio.y[1],
  )
  // Con zoom y pocos puntos a la vista, cada punto lleva el nombre de su país
  const conNombres = zoom != null && enVista.length <= 25

  function acercar(factor: number) {
    const elegido = datos.find((d) => d.iso === pais)
    const dentro = elegido && enVista.includes(elegido)
    const cx = dentro ? elegido.pib_pc : Math.sqrt(dominio.x[0] * dominio.x[1])
    const cy = dentro ? elegido.co2_pc : Math.sqrt(dominio.y[0] * dominio.y[1])
    const x = escalarRango(dominio.x, factor, cx, COMPLETO.x)
    const y = escalarRango(dominio.y, factor, cy, COMPLETO.y)
    setZoom(x === COMPLETO.x && y === COMPLETO.y ? null : { x, y })
  }

  const subtitulo = `Tamaño = población · Escala logarítmica${anio > ANIO_MAX_PIB ? ` · PIB de ${ANIO_MAX_PIB}` : ''}`

  return (
    <Tarjeta
      titulo="PIB per cápita vs CO₂ per cápita"
      subtitulo={subtitulo}
      className={className}
      descarga={{
        nombre: `pib-vs-co2-per-capita-${anioPib}`,
        imagen: true,
        filas: () =>
          datos.map((d) => ({
            pais: d.nombre,
            iso: d.iso,
            continente: d.continente,
            anio: anioPib,
            pib_per_capita_usd_ppa: Math.round(d.pib_pc),
            co2_per_capita_t: d.co2_pc,
            poblacion: d.poblacion,
          })),
      }}
    >
      <div ref={refEntrada} className={`${estilos.grafica} ${estilos.arrastrable}`}>
        {/* Zoom: + / − (hacia el país elegido si está a la vista) y volver a la vista completa */}
        <div className={estilos.zoom} role="group" aria-label="Zoom de la dispersión">
          <button type="button" onClick={() => acercar(0.5)} aria-label="Acercar la dispersión" title="Acercar">
            +
          </button>
          <button type="button" onClick={() => acercar(2)} disabled={!zoom} aria-label="Alejar la dispersión" title="Alejar">
            −
          </button>
          <button type="button" onClick={() => setZoom(null)} disabled={!zoom} title="Ver todos los países">
            Todo
          </button>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 12, bottom: 4, left: 12 }}>
            <CartesianGrid stroke={colores.borde} />
            <XAxis
              type="number"
              dataKey="pib_pc"
              name="PIB per cápita"
              scale="log"
              domain={dominio.x}
              ticks={marcasLog(dominio.x[0], dominio.x[1])}
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
              domain={dominio.y}
              ticks={marcasLog(dominio.y[0], dominio.y[1])}
              allowDataOverflow
              tick={ejeTicks}
              axisLine={lineaEje}
              tickLine={false}
              width={56}
              tickFormatter={(v) => numero(Number(v), Number(v) < 0.1 ? 2 : Number(v) < 1 ? 1 : 0)}
              allowDecimals
              label={tituloY('CO₂ per cápita (t/hab)')}
            />
            <ZAxis type="number" dataKey="poblacion" range={[20, 900]} />
            <ZonaArrastre onZoom={setZoom} />
            <Tooltip content={<TooltipPunto />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={visible ? datos : []}
              isAnimationActive={animar}
              animationDuration={DURACION_ENTRADA}
              cursor="pointer"
              onClick={(d) => {
                const punto = (d as unknown as { payload: Punto }).payload
                seleccionar(punto.iso, punto.continente)
              }}
            >
              {datos.map((d) => (
                <Cell
                  key={d.iso}
                  fill={d.iso === pais ? colores.texto : colores.emision}
                  fillOpacity={d.iso === pais ? 0.9 : 0.5}
                  stroke={d.iso === pais ? colores.texto : colores.emision}
                />
              ))}
              {conNombres && (
                <LabelList
                  dataKey="nombre"
                  // Texto en una sola línea, centrado sobre el punto y sin bloquear el clic
                  content={(props) => {
                    const caja = props.viewBox as { x?: number; y?: number; width?: number } | undefined
                    if (caja?.x == null || caja.y == null) return null
                    return (
                      <text
                        x={caja.x + (caja.width ?? 0) / 2}
                        y={caja.y - 5}
                        textAnchor="middle"
                        fontSize={10}
                        fill={colores.texto}
                        pointerEvents="none"
                      >
                        {props.value}
                      </text>
                    )
                  }}
                />
              )}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className={estilos.nota}>
        {zoom
          ? `Zoom: ${enVista.length} de ${datos.length} países a la vista${conNombres ? ' · con nombre' : ''}`
          : 'Arrastra sobre la gráfica para acercarte a una zona, o usa + / −'}
      </p>
    </Tarjeta>
  )
}
