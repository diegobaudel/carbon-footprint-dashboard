import { useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeInstance } from 'globe.gl'
import { geoCentroid } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import type { Feature, Geometry } from 'geojson'
import { scaleThreshold } from 'd3-scale'
import { MeshBasicMaterial } from 'three'
import { useFiltros } from '../../context/filtros.ts'
import { useTema } from '../../hooks/useTema.ts'
import { cortesMapa, escalaMapa } from '../../styles/palette.ts'
import { ANIO_MIN, type Continente, type RegistroPais } from '../../types.ts'
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

/** Hacia dónde mira el globo al filtrar por continente. */
const VISTA_CONTINENTE: Record<Continente, { lat: number; lng: number; altitude: number }> = {
  África: { lat: 3, lng: 20, altitude: 1.5 },
  Asia: { lat: 32, lng: 92, altitude: 1.6 },
  Europa: { lat: 52, lng: 15, altitude: 0.95 },
  Norteamérica: { lat: 42, lng: -98, altitude: 1.45 },
  Sudamérica: { lat: -18, lng: -60, altitude: 1.4 },
  Oceanía: { lat: -24, lng: 140, altitude: 1.35 },
}

/**
 * Materiales "sin luz" (MeshBasicMaterial): el color del país se ve tal cual la escala,
 * sin oscurecerse por la iluminación del globo, así resalta sobre la imagen satelital.
 * Se reutilizan por color y opacidad para no crear miles de materiales.
 */
const materiales = new Map<string, MeshBasicMaterial>()
function material(color: string, opacidad: number): MeshBasicMaterial {
  const clave = `${color}-${opacidad}`
  let m = materiales.get(clave)
  if (!m) {
    m = new MeshBasicMaterial({ color, transparent: opacidad < 1, opacity: opacidad })
    materiales.set(clave, m)
  }
  return m
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
      // Sin animación entre estados: los colores cambian al instante al mover filtros
      .polygonsTransitionDuration(0)
      // Polígonos con menos triángulos: el globo gira más fluido en equipos modestos
      .polygonCapCurvatureResolution(8)
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
      // onZoom se dispara en cada cuadro del giro; React ignora el cambio si el tramo es el mismo
      .onZoom((pov) => setTramo(tramoDe(pov.altitude)))

    // Pantallas de alta densidad: se limita la resolución del lienzo (la diferencia
    // casi no se nota y el giro va mucho más suave)
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const controles = g.controls()
    controles.enableDamping = true // el giro frena con suavidad al soltar
    controles.dampingFactor = 0.08
    controles.rotateSpeed = 0.6
    controles.zoomSpeed = 1.6 // la rueda acerca más rápido
    controles.autoRotate = true
    controles.autoRotateSpeed = 0.25

    // Al tocarlo deja de girar solo; 8 s después de soltarlo vuelve a girar
    // (salvo que haya un país seleccionado, para no perderlo de vista)
    let espera: ReturnType<typeof setTimeout> | undefined
    const detener = () => {
      clearTimeout(espera)
      controles.autoRotate = false
    }
    const reanudar = () => {
      clearTimeout(espera)
      espera = setTimeout(() => {
        const s = estado.current
        if (s.pais === 'Todos' && s.continente === 'Todos') controles.autoRotate = true
      }, 8000)
    }
    controles.addEventListener('start', detener)
    controles.addEventListener('end', reanudar)

    const medir = () => g.width(el.clientWidth).height(el.clientHeight)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)

    // Si el globo no está en pantalla (scroll o pestaña oculta) se pausa el dibujo
    let visible = true
    const actualizarPausa = () => {
      if (visible && !document.hidden) g.resumeAnimation()
      else g.pauseAnimation()
    }
    const vista = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      actualizarPausa()
    })
    vista.observe(el)
    document.addEventListener('visibilitychange', actualizarPausa)

    globo.current = g
    return () => {
      clearTimeout(espera)
      obs.disconnect()
      vista.disconnect()
      document.removeEventListener('visibilitychange', actualizarPausa)
      controles.removeEventListener('start', detener)
      controles.removeEventListener('end', reanudar)
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

  // Los polígonos se cargan una sola vez; después solo cambian colores y alturas
  useEffect(() => {
    if (geo) globo.current?.polygonsData(geo)
  }, [geo])

  // Colores y relieve. Con un país elegido: él resalta y sube, su continente queda
  // medio y el resto se atenúa (aunque no haya filtro de continente).
  useEffect(() => {
    const g = globo.current
    if (!g || !geo) return
    const elegido = pais !== 'Todos' ? porIso.get(pais) : undefined
    const continenteFoco = elegido?.continente ?? (continente !== 'Todos' ? continente : null)
    // Lejos los colores van casi sólidos para dominar sobre la Tierra; cerca se aclaran
    // para dejar ver ciudades y calles de OpenStreetMap
    const alfa = tramo === 'lejos' ? 0.94 : tramo === 'medio' ? 0.8 : 0.25
    const contorno = tema === 'oscuro' ? 'rgba(230, 236, 245, 0.55)' : 'rgba(255, 255, 255, 0.85)'

    const opacidad = (iso: string | null, r: RegistroPais | undefined): number => {
      if (iso && iso === pais) return 1
      if (continenteFoco && r?.continente !== continenteFoco) return 0.14
      if (elegido) return alfa * 0.6 // mismo continente que el país elegido
      return alfa
    }

    g.polygonCapMaterial((f: object) => {
      const iso = (f as Pais).properties.iso
      const r = iso ? porIso.get(iso) : undefined
      if (r?.co2_pc == null) return material('#a0a8b4', 0.25)
      return material(escala(r.co2_pc), opacidad(iso, r))
    })
      .polygonSideMaterial((f: object) => {
        const iso = (f as Pais).properties.iso
        const r = iso ? porIso.get(iso) : undefined
        if (r?.co2_pc == null) return material('#000000', 0)
        return material(escala(r.co2_pc), iso === pais ? 1 : Math.min(0.75, opacidad(iso, r)))
      })
      .polygonStrokeColor((f: object) => ((f as Pais).properties.iso === pais ? '#ffffff' : contorno))
      .polygonAltitude((f: object) => {
        const iso = (f as Pais).properties.iso
        const r = iso ? porIso.get(iso) : undefined
        const extra = iso === pais ? 0.035 : 0 // el país elegido sobresale
        if (tramo !== 'lejos') return 0.004 + extra
        // Lejos: el país sube según sus emisiones por persona (máx. ~0.12 radios)
        return 0.006 + Math.min(r?.co2_pc ?? 0, 30) * 0.004 + extra
      })
  }, [geo, porIso, continente, pais, tramo, tema])

  // Nombres de países a media distancia como etiquetas HTML (mucho más rápidas que
  // el texto 3D); cerca ya los trae OpenStreetMap
  const etiquetasCache = useRef(new Map<string, HTMLDivElement>())
  useEffect(() => {
    const g = globo.current
    if (!g) return
    const datos =
      tramo === 'medio'
        ? [...porIso.values()]
            .filter((r) => centros.has(r.iso))
            .sort((a, b) => b.poblacion - a.poblacion)
            .slice(0, 50)
            .map((r) => ({ ...centros.get(r.iso)!, texto: r.pais, iso: r.iso }))
        : []
    g.htmlElementsData(datos)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.02)
      .htmlElement((d: object) => {
        const { iso, texto } = d as { iso: string; texto: string }
        let el = etiquetasCache.current.get(iso)
        if (!el) {
          el = document.createElement('div')
          el.className = 'etiqueta-globo'
          etiquetasCache.current.set(iso, el)
        }
        el.textContent = texto
        return el
      })
      .htmlElementVisibilityModifier((el, visible) => {
        el.style.opacity = visible ? '1' : '0'
      })
  }, [porIso, centros, tramo])

  function acercar(factor: number) {
    const g = globo.current
    if (!g) return
    const pov = g.pointOfView()
    g.controls().autoRotate = false
    g.pointOfView({ altitude: Math.min(4, Math.max(0.02, pov.altitude * factor)) }, 350)
  }

  // Los filtros mueven el planeta: país → lo centra; continente → gira hacia él;
  // al quitar ambos vuelve a la vista inicial y a girar solo
  const filtroPrevio = useRef({ continente, pais })
  useEffect(() => {
    const g = globo.current
    if (!g) return
    const previo = filtroPrevio.current
    filtroPrevio.current = { continente, pais }
    if (pais !== 'Todos') {
      const c = centros.get(pais)
      if (!c) return
      g.controls().autoRotate = false
      g.pointOfView({ ...c, altitude: Math.min(g.pointOfView().altitude, 1.4) }, 1200)
    } else if (continente !== 'Todos') {
      g.controls().autoRotate = false
      g.pointOfView(VISTA_CONTINENTE[continente], 1200)
    } else if (previo.continente !== 'Todos' || previo.pais !== 'Todos') {
      g.pointOfView(VISTA_INICIAL, 1200)
      g.controls().autoRotate = true
    }
  }, [continente, pais, centros])

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
      <div className={estilos.zoomGlobo}>
        <button type="button" onClick={() => acercar(0.55)} aria-label="Acercar" title="Acercar">
          +
        </button>
        <button type="button" onClick={() => acercar(1.8)} aria-label="Alejar" title="Alejar">
          −
        </button>
      </div>
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
