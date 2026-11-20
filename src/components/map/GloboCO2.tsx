import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeInstance } from 'globe.gl'
import { geoCentroid } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, Geometry } from 'geojson'
import { scaleThreshold } from 'd3-scale'
import { useFiltros } from '../../context/filtros.ts'
import { useTema } from '../../hooks/useTema.ts'
import { cortesMapa, escalaMapa } from '../../styles/palette.ts'
import { ANIO_MIN, type RegistroPais } from '../../types.ts'
import { cambioPct } from '../../utils/calculos.ts'
import { numero, poblacion, porcentaje } from '../../utils/formato.ts'
import estilos from './Mapa.module.css'

/** Polígonos 1:110m: suficientes para el globo y ligeros para WebGL. */
const URL_MAPA = `${import.meta.env.BASE_URL}data/mundo-110m.json`

/**
 * Teselas sobre el globo, todas sin clave:
 * - lejos: imagen satelital de la NASA (GIBS, dominio público). De día Blue Marble;
 *   en modo oscuro, las luces de las ciudades de noche.
 * - cerca: OpenStreetMap, con ciudades, carreteras y nombres.
 */
const NIVEL_MAX_NASA = 7
const NASA = {
  claro: 'BlueMarble_ShadedRelief_Bathymetry',
  oscuro: 'VIIRS_CityLights_2012',
}

function urlTesela(tema: 'claro' | 'oscuro') {
  return (x: number, y: number, nivel: number) =>
    nivel <= NIVEL_MAX_NASA
      ? `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${NASA[tema]}/default/GoogleMapsCompatible_Level8/${nivel}/${y}/${x}.jpeg`
      : `https://tile.openstreetmap.org/${nivel}/${x}/${y}.png`
}

/** Vista inicial del planeta (altitud en radios terrestres sobre la superficie). */
const VISTA_INICIAL = { lat: 18, lng: -20, altitude: 2.3 }

/** Tramos de acercamiento: el relieve y los colores se ajustan para no tapar el mapa. */
type Tramo = 'lejos' | 'medio' | 'cerca'
function tramoDe(altitud: number): Tramo {
  if (altitud > 1.1) return 'lejos'
  if (altitud > 0.35) return 'medio'
  return 'cerca'
}

const escala = scaleThreshold<number, string>().domain([...cortesMapa]).range([...escalaMapa])

type Pais = Feature<Geometry, { iso: string | null; name: string }>

function conAlfa(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

interface Props {
  paises: RegistroPais[]
  /** Cambia cuando el usuario pide "Restablecer vista". */
  reinicio: number
}

/**
 * Globo 3D (globe.gl / three.js). Cada país se eleva según su CO₂ per cápita y se pinta
 * con la escala naranja-café semitransparente sobre la Tierra satelital. Al acercarse
 * aparece OpenStreetMap con ciudades y calles. Clic en un país: gira hacia él, muestra su
 * ficha y aplica el filtro de país en todo el dashboard.
 */
export default function GloboCO2({ paises, reinicio }: Props) {
  const { anio, continente, pais, setContinente, setPais } = useFiltros()
  const tema = useTema()
  const contenedor = useRef<HTMLDivElement>(null)
  const globo = useRef<GlobeInstance | null>(null)
  const [geo, setGeo] = useState<Pais[] | null>(null)
  const [tramo, setTramo] = useState<Tramo>('lejos')

  // Polígonos de países (una sola vez)
  useEffect(() => {
    let activo = true
    fetch(URL_MAPA)
      .then((r) => r.json() as Promise<Topology<{ countries: GeometryCollection<Pais['properties']> }>>)
      .then((topo) => {
        if (activo) setGeo(feature(topo, topo.objects.countries).features as Pais[])
      })
      .catch(() => {
        if (activo) setGeo([])
      })
    return () => {
      activo = false
    }
  }, [])

  const porIso = useMemo(
    () => new Map(paises.filter((p) => p.anio === anio).map((p) => [p.iso, p])),
    [paises, anio],
  )

  const centros = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>()
    for (const f of geo ?? []) {
      if (!f.properties.iso) continue
      const [lng, lat] = geoCentroid(f)
      m.set(f.properties.iso, { lat, lng })
    }
    return m
  }, [geo])

  // Referencia siempre al día para los callbacks del globo (se crean una sola vez)
  const estado = useRef({ porIso, continente, pais, setContinente, setPais, centros })
  useEffect(() => {
    estado.current = { porIso, continente, pais, setContinente, setPais, centros }
  })

  // Crear el globo una sola vez
  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const g = new Globe(el, { animateIn: true })
      .backgroundColor('rgba(0,0,0,0)')
      .pointOfView(VISTA_INICIAL)
      .polygonsTransitionDuration(400)
      .polygonLabel((f: object) => {
        const p = f as Pais
        const r = p.properties.iso ? estado.current.porIso.get(p.properties.iso) : undefined
        const nombre = escaparHtml(r?.pais ?? p.properties.name)
        const detalle =
          r?.co2_pc != null
            ? `${numero(r.co2_pc, 1)} t/hab · ${numero(r.co2, 0)} Mt · ${poblacion(r.poblacion)}`
            : 'Sin dato registrado'
        return `<div class="tooltip-globo"><strong>${nombre}</strong><br/>${detalle}</div>`
      })
      .onPolygonClick((f: object) => {
        const iso = (f as Pais).properties.iso
        const s = estado.current
        if (!iso) return
        const r = s.porIso.get(iso)
        if (!r) return
        if (iso === s.pais) {
          s.setPais('Todos')
          return
        }
        if (s.continente !== 'Todos' && r.continente && r.continente !== s.continente) {
          s.setContinente(r.continente)
        }
        s.setPais(iso)
      })
      .onZoom((pov) => setTramo(tramoDe(pov.altitude)))

    const controles = g.controls()
    controles.autoRotate = true
    controles.autoRotateSpeed = 0.35
    // Al tocarlo deja de girar solo
    const detener = () => {
      controles.autoRotate = false
    }
    controles.addEventListener('start', detener)

    const medir = () => g.width(el.clientWidth).height(el.clientHeight)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)

    globo.current = g
    return () => {
      obs.disconnect()
      controles.removeEventListener('start', detener)
      g._destructor()
      el.innerHTML = ''
      globo.current = null
    }
  }, [])

  // Teselas y atmósfera según el tema
  useEffect(() => {
    globo.current
      ?.globeTileEngineUrl(urlTesela(tema))
      .atmosphereColor(tema === 'oscuro' ? '#5b6b8a' : '#9fc5e8')
      .atmosphereAltitude(0.18)
  }, [tema])

  // Polígonos: color por CO₂ per cápita, relieve según el acercamiento
  useEffect(() => {
    const g = globo.current
    if (!g || !geo) return
    const alfa = tramo === 'lejos' ? 0.78 : tramo === 'medio' ? 0.55 : 0.18
    const contorno = tema === 'oscuro' ? 'rgba(220, 228, 240, 0.35)' : 'rgba(255, 255, 255, 0.6)'
    g.polygonsData(geo)
      .polygonCapColor((f: object) => {
        const iso = (f as Pais).properties.iso
        const r = iso ? porIso.get(iso) : undefined
        const fuera = continente !== 'Todos' && r?.continente !== continente
        if (r?.co2_pc == null) return 'rgba(160, 168, 180, 0.15)'
        return conAlfa(escala(r.co2_pc), fuera ? 0.12 : iso === pais ? 0.95 : alfa)
      })
      .polygonSideColor((f: object) => {
        const iso = (f as Pais).properties.iso
        const r = iso ? porIso.get(iso) : undefined
        return r?.co2_pc != null ? conAlfa(escala(r.co2_pc), 0.35) : 'rgba(0,0,0,0)'
      })
      .polygonStrokeColor((f: object) => ((f as Pais).properties.iso === pais ? '#ffffff' : contorno))
      .polygonAltitude((f: object) => {
        const iso = (f as Pais).properties.iso
        const r = iso ? porIso.get(iso) : undefined
        if (tramo === 'cerca') return 0.002
        if (tramo === 'medio') return 0.006
        // Lejos: el país sube según sus emisiones por persona (máx. ~0.12 radios)
        return 0.006 + Math.min(r?.co2_pc ?? 0, 30) * 0.004
      })

    // Nombres de los países más poblados a media distancia (cerca ya los trae OSM)
    const etiquetas =
      tramo === 'medio'
        ? [...porIso.values()]
            .filter((r) => centros.has(r.iso))
            .sort((a, b) => b.poblacion - a.poblacion)
            .slice(0, 60)
            .map((r) => ({ ...centros.get(r.iso)!, texto: r.pais, iso: r.iso }))
        : []
    g.labelsData(etiquetas)
      .labelLat('lat')
      .labelLng('lng')
      .labelText('texto')
      .labelSize(0.55)
      .labelDotRadius(0.25)
      .labelAltitude(0.012)
      .labelColor(() => (tema === 'oscuro' ? 'rgba(241, 245, 249, 0.9)' : 'rgba(27, 42, 74, 0.9)'))
      .labelResolution(2)
  }, [geo, porIso, continente, pais, tramo, tema, centros])

  // Al elegir un país (aquí o en el filtro) el globo gira hasta centrarlo
  useEffect(() => {
    const g = globo.current
    if (!g || pais === 'Todos') return
    const c = centros.get(pais)
    if (!c) return
    g.controls().autoRotate = false
    g.pointOfView({ ...c, altitude: Math.min(g.pointOfView().altitude, 1.4) }, 1200)
  }, [pais, centros])

  // "Restablecer vista": vuelve al planeta completo y a girar solo
  useEffect(() => {
    const g = globo.current
    if (!g || reinicio === 0) return
    g.pointOfView(VISTA_INICIAL, 1000)
    g.controls().autoRotate = true
  }, [reinicio])

  // Ficha del país seleccionado
  const elegido = pais !== 'Todos' ? porIso.get(pais) : undefined
  const base = elegido ? paises.find((p) => p.iso === elegido.iso && p.anio === ANIO_MIN) : undefined
  const cambio = cambioPct(base?.co2, elegido?.co2)

  return (
    <div className={`${estilos.globo} ${tema === 'oscuro' ? estilos.globoNoche : ''}`}>
      <div ref={contenedor} className={estilos.lienzoGlobo} />
      {!geo && <p className={estilos.cargando}>Cargando globo…</p>}
      <aside className={estilos.ficha} aria-live="polite">
        {elegido ? (
          <>
            <p className={estilos.fichaEtiqueta}>País seleccionado · {anio}</p>
            <p className={estilos.fichaNombre}>{elegido.pais}</p>
            <dl className={estilos.fichaDatos}>
              <dt>CO₂ por persona</dt>
              <dd>{numero(elegido.co2_pc, 1)} t</dd>
              <dt>CO₂ total</dt>
              <dd>{numero(elegido.co2, 0)} Mt</dd>
              <dt>Población</dt>
              <dd>{poblacion(elegido.poblacion)}</dd>
              <dt>Cambio vs {ANIO_MIN}</dt>
              <dd className={cambio != null && cambio < 0 ? estilos.fichaBaja : estilos.fichaSube}>
                {porcentaje(cambio)}
              </dd>
            </dl>
          </>
        ) : (
          <>
            <p className={estilos.fichaEtiqueta}>Globo 3D · {anio}</p>
            <p className={estilos.fichaAyuda}>
              Arrastra para girar, acércate con la rueda y toca un país para ver su ficha. La altura de
              cada país es su CO₂ por persona.
            </p>
          </>
        )}
      </aside>
    </div>
  )
}
