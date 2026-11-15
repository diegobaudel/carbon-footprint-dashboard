import { useMemo, useState, type MouseEvent } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleThreshold } from 'd3-scale'
import { useFiltros } from '../../context/filtros.ts'
import { colores, cortesMapa, escalaMapa } from '../../styles/palette.ts'
import type { RegistroPais } from '../../types.ts'
import { numero, poblacion } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Mapa.module.css'

/** TopoJSON de Natural Earth 1:110m con ISO3 (lo genera scripts/preparar_mapa.py). */
const URL_MAPA = `${import.meta.env.BASE_URL}data/mundo-110m.json`

/** Escala secuencial de 5 clases: <1, 1–3, 3–6, 6–10, ≥10 t/hab. */
const escala = scaleThreshold<number, string>().domain([...cortesMapa]).range([...escalaMapa])

const ETIQUETAS_RANGO = ['< 1', '1–3', '3–6', '6–10', '≥ 10']

interface Hover {
  x: number
  y: number
  registro: RegistroPais | undefined
  nombre: string
}

/**
 * Mapa coroplético de CO₂ per cápita del año filtrado. Mapa: distribución geográfica.
 * Clic en un país para filtrarlo (otro clic lo quita).
 */
export function MapaCO2({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais, setContinente, setPais } = useFiltros()
  const [hover, setHover] = useState<Hover | null>(null)

  const porIso = useMemo(
    () => new Map(paises.filter((p) => p.anio === anio).map((p) => [p.iso, p])),
    [paises, anio],
  )

  function alClic(iso: string | null) {
    if (!iso) return
    const registro = porIso.get(iso)
    if (!registro) return
    if (iso === pais) {
      setPais('Todos')
      return
    }
    if (continente !== 'Todos' && registro.continente && registro.continente !== continente) {
      setContinente(registro.continente)
    }
    setPais(iso)
  }

  function alMover(e: MouseEvent<SVGPathElement>, iso: string | null, nombre: string) {
    const caja = e.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
    if (!caja) return
    setHover({
      x: e.clientX - caja.left,
      y: e.clientY - caja.top,
      registro: iso ? porIso.get(iso) : undefined,
      nombre,
    })
  }

  return (
    <Tarjeta titulo="Mapa mundial de CO₂ per cápita" subtitulo="Clic en un país para filtrar" className={className}>
      <div className={estilos.contenedor} onMouseLeave={() => setHover(null)}>
        <ComposableMap
          projection="geoEqualEarth"
          projectionConfig={{ scale: 165, center: [10, 8] }}
          width={860}
          height={360}
          className={estilos.svg}
        >
          <Geographies geography={URL_MAPA}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const iso = (geo.properties?.iso as string | null) ?? null
                const nombre = (geo.properties?.name as string) ?? ''
                const registro = iso ? porIso.get(iso) : undefined
                const valor = registro?.co2_pc
                const fuera = continente !== 'Todos' && registro?.continente !== continente
                const elegido = iso != null && iso === pais
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={estilos.pais}
                    fill={valor != null ? escala(valor) : colores.sinDato}
                    fillOpacity={fuera ? 0.3 : 1}
                    stroke={elegido ? colores.marino : '#ffffff'}
                    strokeWidth={elegido ? 1.6 : 0.4}
                    onClick={() => alClic(iso)}
                    onMouseMove={(e) => alMover(e, iso, nombre)}
                  />
                )
              })
            }
          </Geographies>
        </ComposableMap>

        {hover && (
          <div className={estilos.tooltip} style={{ left: hover.x, top: hover.y }}>
            <strong>{hover.registro?.pais ?? hover.nombre}</strong>
            <br />
            {hover.registro?.co2_pc != null
              ? `${numero(hover.registro.co2_pc, 1)} t/hab · Población ${poblacion(hover.registro.poblacion)}`
              : 'Sin dato'}
          </div>
        )}
      </div>

      <div className={estilos.leyenda}>
        <span>t CO₂/hab · {anio}</span>
        <div className={estilos.rangos}>
          {ETIQUETAS_RANGO.map((etiqueta, i) => (
            <div key={etiqueta} className={estilos.rango}>
              <span className={estilos.muestra} style={{ background: escalaMapa[i] }} />
              {etiqueta}
            </div>
          ))}
        </div>
        <span className={estilos.sinDato}>
          <span className={estilos.muestra} style={{ background: colores.sinDato }} />
          Sin dato
        </span>
      </div>
    </Tarjeta>
  )
}
