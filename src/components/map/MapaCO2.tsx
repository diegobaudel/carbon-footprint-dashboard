import 'leaflet/dist/leaflet.css'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { GeoJSON, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { geoJSON, type LatLngBoundsExpression, type Map as MapaLeaflet, type PathOptions } from 'leaflet'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { scaleThreshold } from 'd3-scale'
import { useFiltros } from '../../context/filtros.ts'
import { useTema } from '../../hooks/useTema.ts'
import { colores, cortesMapa, escalaMapa } from '../../styles/palette.ts'
import type { RegistroPais } from '../../types.ts'
import { numero, poblacion } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import estilos from './Mapa.module.css'

/** TopoJSON de Natural Earth 1:50m con ISO3 (lo genera scripts/preparar_mapa.py). */
const URL_MAPA = `${import.meta.env.BASE_URL}data/mundo-50m.json`

/**
 * Mapa base de OpenStreetMap: no pide clave ni registro, solo la atribución visible.
 * El color se ajusta con un filtro CSS (gris en claro, invertido en oscuro) en Mapa.module.css.
 */
const TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/** A partir de este zoom (país/región) los colores se aclaran para leer ciudades y calles. */
const ZOOM_CERCA = 5

/** Vista inicial: todo el mundo habitado, sin la Antártida. */
const MUNDO: LatLngBoundsExpression = [
  [-50, -165],
  [75, 175],
]

/** Escala secuencial de 5 clases: <1, 1–3, 3–6, 6–10, ≥10 t/hab. */
const escala = scaleThreshold<number, string>().domain([...cortesMapa]).range([...escalaMapa])

const ETIQUETAS_RANGO = ['< 1', '1–3', '3–6', '6–10', '≥ 10']

type Pais = Feature<Geometry, { iso: string | null; name: string }>

/**
 * Los países que cruzan la línea de cambio de fecha (Rusia, Fiyi) traen puntos en
 * −180° y +180° seguidos; en un mapa plano eso se dibuja como una franja de lado a
 * lado. Se "desenrolla" cada anillo para que la longitud nunca salte más de 180°.
 */
function desenrollar(anillo: number[][]): number[][] {
  let anterior: number | null = null
  return anillo.map(([lon, lat]) => {
    let x = lon
    if (anterior !== null) {
      while (x - anterior > 180) x -= 360
      while (x - anterior < -180) x += 360
    }
    anterior = x
    return [x, lat]
  })
}

function corregirAntimeridiano(f: Pais): Pais {
  const g = f.geometry
  if (g.type === 'Polygon') {
    return { ...f, geometry: { ...g, coordinates: g.coordinates.map(desenrollar) } }
  }
  if (g.type === 'MultiPolygon') {
    return { ...f, geometry: { ...g, coordinates: g.coordinates.map((p) => p.map(desenrollar)) } }
  }
  return f
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/**
 * La rueda del mouse solo hace zoom después de dar clic en el mapa;
 * así hacer scroll en la página no se "atora" encima del mapa.
 */
function ZoomConRueda() {
  const mapa = useMap()
  useEffect(() => {
    const activar = () => mapa.scrollWheelZoom.enable()
    const desactivar = () => mapa.scrollWheelZoom.disable()
    mapa.on('click focus', activar)
    mapa.on('blur mouseout', desactivar)
    return () => {
      mapa.off('click focus', activar)
      mapa.off('blur mouseout', desactivar)
    }
  }, [mapa])
  return null
}

/** Avisa al mapa si está lejos (mundo) o cerca (región), para ajustar la transparencia. */
function SeguirZoom({ alCambiar }: { alCambiar: (cerca: boolean) => void }) {
  const mapa = useMapEvents({ zoomend: () => alCambiar(mapa.getZoom() >= ZOOM_CERCA) })
  return null
}

/** El globo 3D (three.js) se descarga solo cuando alguien abre esa vista. */
const GloboCO2 = lazy(() => import('./GloboCO2.tsx'))

function soportaWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'))
  } catch {
    return false
  }
}

type Vista = 'mapa' | 'globo'

/**
 * Mapa coroplético de CO₂ per cápita del año filtrado, sobre un mapa base con zoom
 * (Leaflet + OpenStreetMap). Al acercarse, los colores se aclaran para ver ciudades.
 * Clic en un país para filtrarlo (otro clic lo quita).
 */
export function MapaCO2({ paises, className }: { paises: RegistroPais[]; className?: string }) {
  const { anio, continente, pais, setContinente, setPais } = useFiltros()
  const tema = useTema()
  const [cerca, setCerca] = useState(false)
  const [conWebGL] = useState(soportaWebGL)
  // El globo 3D es la vista inicial; sin WebGL se queda el mapa plano
  const [vista, setVista] = useState<Vista>(() => (conWebGL ? 'globo' : 'mapa'))
  const [reinicioGlobo, setReinicioGlobo] = useState(0)
  const mapaRef = useRef<MapaLeaflet | null>(null)
  // El mapa de Leaflet se crea después del primer render: se avisa cuando ya existe
  const [mapaListo, setMapaListo] = useState(false)

  function restablecerVista() {
    if (vista === 'mapa') mapaRef.current?.fitBounds(MUNDO)
    else setReinicioGlobo((n) => n + 1)
  }

  const selectorVista = conWebGL ? (
    <div className={estilos.switchVista} role="group" aria-label="Tipo de mapa">
      {(['globo', 'mapa'] as const).map((v) => (
        <button
          key={v}
          type="button"
          className={vista === v ? estilos.vistaActiva : ''}
          onClick={() => setVista(v)}
        >
          {v === 'mapa' ? 'Mapa' : 'Globo 3D'}
        </button>
      ))}
    </div>
  ) : undefined
  const [geo, setGeo] = useState<FeatureCollection<Geometry, Pais['properties']> | null>(null)

  useEffect(() => {
    let activo = true
    fetch(URL_MAPA)
      .then((r) => r.json() as Promise<Topology<{ countries: GeometryCollection<Pais['properties']> }>>)
      .then((topo) => {
        if (!activo) return
        const fc = feature(topo, topo.objects.countries)
        setGeo({ ...fc, features: fc.features.map(corregirAntimeridiano) })
      })
      .catch(() => {
        if (activo) setGeo({ type: 'FeatureCollection', features: [] })
      })
    return () => {
      activo = false
    }
  }, [])

  const porIso = useMemo(
    () => new Map(paises.filter((p) => p.anio === anio).map((p) => [p.iso, p])),
    [paises, anio],
  )

  // El mapa plano también sigue a los filtros: país → lo encuadra; continente → lo
  // encuadra; sin filtros → mundo
  useEffect(() => {
    const mapa = mapaRef.current
    if (vista !== 'mapa' || !mapa || !mapaListo || !geo) return
    const elegido = pais !== 'Todos' ? porIso.get(pais) : undefined
    const objetivo = elegido
      ? geo.features.filter((f) => f.properties.iso === pais)
      : continente !== 'Todos'
        ? geo.features.filter((f) => f.properties.iso && porIso.get(f.properties.iso)?.continente === continente)
        : []
    if (objetivo.length === 0) {
      mapa.flyToBounds(MUNDO, { duration: 0.8 })
      return
    }
    const limites = geoJSON({ type: 'FeatureCollection', features: objetivo } as FeatureCollection).getBounds()
    mapa.flyToBounds(limites, { duration: 0.8, maxZoom: elegido ? 5 : 3, padding: [20, 20] })
    // porIso cambia con el año; solo se vuela al cambiar país o continente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pais, continente, vista, geo, mapaListo])

  // Aviso flotante: si hay un país elegido y el mapa no está en pantalla
  const zona = useRef<HTMLDivElement>(null)
  const [mapaVisible, setMapaVisible] = useState(true)
  useEffect(() => {
    const el = zona.current
    if (!el) return
    // rootMargin descuenta la cabecera fija (~200 px): lo que queda detrás no cuenta como visible
    const obs = new IntersectionObserver(([e]) => setMapaVisible(e.isIntersecting), {
      threshold: 0.15,
      rootMargin: '-200px 0px 0px 0px',
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  const elegidoAviso = pais !== 'Todos' ? porIso.get(pais) : undefined

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

  // Con un país elegido: él resalta, su continente queda medio y el resto se atenúa
  const registroElegido = pais !== 'Todos' ? porIso.get(pais) : undefined
  const continenteFoco = registroElegido?.continente ?? (continente !== 'Todos' ? continente : null)

  function estilo(f?: Pais): PathOptions {
    const iso = f?.properties.iso ?? null
    const registro = iso ? porIso.get(iso) : undefined
    const valor = registro?.co2_pc
    const elegido = iso != null && iso === pais
    const base = cerca ? 0.35 : 0.8 // cerca: más transparente para leer ciudades y calles
    const opacidad = elegido
      ? 0.95
      : continenteFoco && registro?.continente !== continenteFoco
        ? 0.12
        : registroElegido
          ? base * 0.6
          : base
    return {
      fillColor: valor != null ? escala(valor) : colores.sinDato,
      fillOpacity: opacidad,
      color: elegido ? colores.texto : colores.contorno,
      weight: elegido ? 3 : 0.6,
    }
  }

  return (
    <Tarjeta
      titulo="Mapa mundial de CO₂ per cápita"
      subtitulo={
        vista === 'mapa'
          ? 'Clic en un país para filtrar · clic en el mapa y rueda (o + / −) para acercarte hasta las ciudades'
          : 'Arrastra para girar el planeta · la altura de cada país es su CO₂ por persona'
      }
      acciones={selectorVista}
      className={className}
    >
      <div ref={zona} className={estilos.contenedor}>
        {vista === 'globo' ? (
          <Suspense fallback={<p className={estilos.cargando}>Cargando globo…</p>}>
            <GloboCO2 paises={paises} reinicio={reinicioGlobo} />
          </Suspense>
        ) : (
          <MapContainer
            ref={(m) => {
              mapaRef.current = m
              setMapaListo(m !== null)
            }}
            bounds={MUNDO}
            minZoom={0}
            maxZoom={12}
            maxBounds={[
              [-75, -200],
              [85, 200],
            ]}
            maxBoundsViscosity={1}
            scrollWheelZoom={false}
            worldCopyJump={false}
            className={estilos.mapa}
          >
            <TileLayer url={TESELAS} attribution={ATRIBUCION} maxZoom={19} />
            {geo && (
              <GeoJSON
                // Se vuelve a crear al cambiar filtros para repintar colores y textos
                key={`${anio}-${continente}-${pais}-${tema}-${cerca}`}
                data={geo}
                style={estilo}
                onEachFeature={(f: Pais, capa) => {
                  const iso = f.properties.iso
                  const registro = iso ? porIso.get(iso) : undefined
                  const nombre = escaparHtml(registro?.pais ?? f.properties.name)
                  const detalle =
                    registro?.co2_pc != null
                      ? `${numero(registro.co2_pc, 1)} t/hab · Población ${poblacion(registro.poblacion)}`
                      : 'Sin dato registrado'
                  capa.bindTooltip(`<strong>${nombre}</strong><br/>${detalle}`, {
                    sticky: true,
                    className: 'tooltip-co2',
                  })
                  capa.on('click', () => alClic(iso))
                }}
              />
            )}
            <SeguirZoom alCambiar={setCerca} />
            <ZoomConRueda />
          </MapContainer>
        )}
        {vista === 'mapa' && !geo && <p className={estilos.cargando}>Cargando mapa…</p>}
        <button type="button" className={estilos.botonMundo} onClick={restablecerVista}>
          Restablecer vista
        </button>
      </div>

      {elegidoAviso && !mapaVisible && (
        <button
          type="button"
          className={estilos.avisoFlotante}
          onClick={() => zona.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
        >
          <strong>{elegidoAviso.pais}</strong>
          <span>{numero(elegidoAviso.co2_pc, 1)} t/hab · ver en el {vista === 'globo' ? 'globo' : 'mapa'} ↑</span>
        </button>
      )}

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
