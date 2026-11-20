import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
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
import { ANIO_MAX, ANIO_MIN, type Continente, type RegistroPais } from '../../types.ts'
import { cambioPct } from '../../utils/calculos.ts'
import { cargarCentrosPequenos, type CentroPais } from '../../services/datos.ts'
import { cambioConFlecha, numero, poblacion } from '../../utils/formato.ts'
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

/** Duración del giro hacia un país (ms). */
const DURACION_VUELO = 800

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

/** "#c65d21" + 0.5 → "rgba(198, 93, 33, 0.5)" (los puntos aceptan transparencia así). */
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
  const { anio, continente, pais: paisFiltro, setContinente, setPais, reproduciendo } = useFiltros()
  const tema = useTema()
  // Clic en el globo: el país se marca, la ficha aparece y la cámara gira al instante
  // (estado local). El resto del dashboard se actualiza cuando termina el giro, para que
  // recalcular las gráficas no frene la animación del planeta.
  const [, iniciarTransicion] = useTransition()
  const [clic, setClic] = useState<{ iso: string; antes: string } | null>(null)
  const pais = clic && clic.antes === paisFiltro ? clic.iso : paisFiltro
  const pendiente = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(pendiente.current), [])
  const contenedor = useRef<HTMLDivElement>(null)
  const globo = useRef<GlobeInstance | null>(null)
  const [geo, setGeo] = useState<Pais[] | null>(null)
  // Países pequeños sin forma en el mapa 1:110m: se dibujan como columnas
  const [puntos, setPuntos] = useState<CentroPais[]>([])
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
    cargarCentrosPequenos().then((c) => {
      if (activo) setPuntos(c)
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
    for (const p of puntos) if (!m.has(p.iso)) m.set(p.iso, { lat: p.lat, lng: p.lng })
    return m
  }, [geo, puntos])

  const elegirDesdeGlobo = (iso: string) => {
    const r = porIso.get(iso)
    if (!r) return
    const nuevo = iso === pais ? 'Todos' : iso
    setClic({ iso: nuevo, antes: paisFiltro })
    clearTimeout(pendiente.current)
    pendiente.current = setTimeout(() => {
      iniciarTransicion(() => {
        setClic(null) // a partir de aquí manda el filtro global
        if (nuevo !== 'Todos' && continente !== 'Todos' && r.continente && r.continente !== continente) {
          setContinente(r.continente)
        }
        setPais(nuevo)
      })
    }, DURACION_VUELO)
  }

  // Referencia siempre al día para los callbacks del globo (se crean una sola vez)
  const estado = useRef({ porIso, continente, pais, centros, elegirDesdeGlobo })
  useEffect(() => {
    estado.current = { porIso, continente, pais, centros, elegirDesdeGlobo }
  })

  // Crear el globo una sola vez
  useEffect(() => {
    const el = contenedor.current
    if (!el) return
    const etiqueta = document.createElement('div')
    etiqueta.className = 'etiqueta-globo'
    const g = new Globe(el, { animateIn: true })
      .backgroundColor('rgba(0,0,0,0)')
      .pointOfView(VISTA_INICIAL)
      // Sin animación entre estados: los colores cambian al instante al mover filtros
      .polygonsTransitionDuration(0)
      // Polígonos con menos triángulos: el globo gira más fluido en equipos modestos
      .polygonCapCurvatureResolution(8)
      // Nombre del país solo al pasar el cursor: una etiqueta sobre el país, sin React
      // (no vuelve a dibujar el componente en cada movimiento del mouse)
      .htmlLat('lat')
      .htmlLng('lng')
      .htmlAltitude(0.13)
      .htmlElement(() => etiqueta)
      .onPolygonHover((f: object | null) => {
        const p = f as Pais | null
        if (!p) {
          g.htmlElementsData([])
          return
        }
        const s = estado.current
        const r = p.properties.iso ? s.porIso.get(p.properties.iso) : undefined
        const centro = (p.properties.iso && s.centros.get(p.properties.iso)) || (() => {
          const [lng, lat] = geoCentroid(p)
          return { lat, lng }
        })()
        etiqueta.innerHTML =
          `<strong>${escaparHtml(r?.pais ?? p.properties.name)}</strong>` +
          `<span>${r?.co2_pc != null ? `${numero(r.co2_pc, 1)} t/hab` : 'Sin dato'}</span>`
        g.htmlElementsData([centro])
      })
      .onPolygonClick((f: object) => {
        const iso = (f as Pais).properties.iso
        if (iso) estado.current.elegirDesdeGlobo(iso)
      })
      // Países pequeños (puntos): mismo comportamiento que los polígonos
      .pointLat('lat')
      .pointLng('lng')
      .pointResolution(10)
      .onPointHover((d: object | null) => {
        const p = d as CentroPais | null
        if (!p) {
          g.htmlElementsData([])
          return
        }
        const r = estado.current.porIso.get(p.iso)
        etiqueta.innerHTML =
          `<strong>${escaparHtml(r?.pais ?? p.iso)}</strong>` +
          `<span>${r?.co2_pc != null ? `${numero(r.co2_pc, 1)} t/hab` : 'Sin dato'}</span>`
        g.htmlElementsData([{ lat: p.lat, lng: p.lng }])
      })
      .onPointClick((d: object) => estado.current.elegirDesdeGlobo((d as CentroPais).iso))
      // onZoom se dispara en cada cuadro del giro; React ignora el cambio si el tramo es el mismo
      .onZoom((pov) => setTramo(tramoDe(pov.altitude)))

    // Pantallas de alta densidad: se limita la resolución del lienzo (la diferencia
    // casi no se nota y el giro va mucho más suave)
    g.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.25))

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

    // Se pausa el dibujo si el globo no está en pantalla, si la pestaña está oculta o
    // mientras se hace scroll (el navegador deja el scroll fluido y el globo se queda
    // quieto como imagen; 150 ms después de soltar vuelve a girar)
    let visible = true
    let desplazando = false
    let finScroll: ReturnType<typeof setTimeout> | undefined
    const actualizarPausa = () => {
      if (visible && !desplazando && !document.hidden) g.resumeAnimation()
      else g.pauseAnimation()
    }
    const alHacerScroll = () => {
      if (!desplazando) {
        desplazando = true
        actualizarPausa()
      }
      clearTimeout(finScroll)
      finScroll = setTimeout(() => {
        desplazando = false
        actualizarPausa()
      }, 150)
    }
    window.addEventListener('scroll', alHacerScroll, { passive: true })
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
      window.removeEventListener('scroll', alHacerScroll)
      clearTimeout(finScroll)
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

  // Al cambiar de año se quita la etiqueta del cursor para no mostrar una cifra vieja
  useEffect(() => {
    globo.current?.htmlElementsData([])
  }, [porIso])

  // Los polígonos se cargan una sola vez; después solo cambian colores y alturas
  useEffect(() => {
    if (geo) globo.current?.polygonsData(geo)
  }, [geo])

  // Colores y relieve. Con un país elegido: él resalta y sube, su continente queda
  // medio y el resto se atenúa (aunque no haya filtro de continente).
  useEffect(() => {
    const g = globo.current
    if (!g || !geo) return
    // Al reproducir los años el relieve sube y baja con suavidad entre un año y otro
    g.polygonsTransitionDuration(reproduciendo ? 700 : 0).pointsTransitionDuration(reproduciendo ? 700 : 0)
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
      // Sin dato: gris tenue; si es el elegido, gris firme para que se note dónde está
      if (r?.co2_pc == null) return material('#a0a8b4', iso != null && iso === pais ? 0.9 : 0.25)
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

    // Puntos de los países pequeños: mismo color, opacidad y altura que tendría su polígono
    const conForma = new Set(geo.map((f) => f.properties.iso))
    g.pointsData(puntos.filter((p) => !conForma.has(p.iso)))
      .pointColor((d: object) => {
        const iso = (d as CentroPais).iso
        const r = porIso.get(iso)
        if (r?.co2_pc == null) return 'rgba(160, 168, 180, 0.6)'
        return conAlfa(escala(r.co2_pc), Math.max(opacidad(iso, r), 0.25))
      })
      .pointRadius((d: object) => ((d as CentroPais).iso === pais ? 1.5 : 0.6))
      .pointAltitude((d: object) => {
        const iso = (d as CentroPais).iso
        const r = porIso.get(iso)
        const extra = iso === pais ? 0.05 : 0
        if (tramo !== 'lejos') return 0.01 + extra
        return 0.01 + Math.min(r?.co2_pc ?? 0, 30) * 0.004 + extra
      })
  }, [geo, puntos, porIso, continente, pais, tramo, tema, reproduciendo])

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
  const vueloHacia = useRef<string | null>(null)
  useEffect(() => {
    const g = globo.current
    if (!g) return
    const previo = filtroPrevio.current
    filtroPrevio.current = { continente, pais }
    if (pais !== 'Todos') {
      // Si ya va hacia este país (p. ej. el continente cambió después del clic) no se reinicia
      if (vueloHacia.current === pais) return
      const c = centros.get(pais)
      if (!c) return
      vueloHacia.current = pais
      g.controls().autoRotate = false
      // Los países pequeños (sin forma, solo punto) se ven más de cerca
      const esPunto = !geo?.some((f) => f.properties.iso === pais)
      g.pointOfView({ ...c, altitude: Math.min(g.pointOfView().altitude, esPunto ? 0.8 : 1.4) }, DURACION_VUELO)
      return
    }
    vueloHacia.current = null
    if (continente !== 'Todos') {
      g.controls().autoRotate = false
      g.pointOfView(VISTA_CONTINENTE[continente], 1200)
    } else if (previo.continente !== 'Todos' || previo.pais !== 'Todos') {
      g.pointOfView(VISTA_INICIAL, 1200)
      g.controls().autoRotate = true
    }
  }, [continente, pais, centros, geo])

  // ▶ Reproducir: sin país elegido el planeta gira un poco más rápido para ver el cambio
  // de colores en todo el mundo; al terminar vuelve a su giro lento
  useEffect(() => {
    const g = globo.current
    if (!g) return
    const controles = g.controls()
    if (reproduciendo && pais === 'Todos' && continente === 'Todos') {
      controles.autoRotateSpeed = 0.7
      controles.autoRotate = true
    } else {
      controles.autoRotateSpeed = 0.25
    }
  }, [reproduciendo, pais, continente])

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
      {/* Mientras se reproduce la serie: el año grande y su avance sobre el globo */}
      {reproduciendo && (
        <div className={estilos.anioGlobo} aria-hidden="true">
          <span>{anio}</span>
          <span className={estilos.avanceAnio}>
            <span style={{ width: `${((anio - ANIO_MIN) / (ANIO_MAX - ANIO_MIN)) * 100}%` }} />
          </span>
        </div>
      )}
      <aside className={estilos.ficha} aria-live="polite">
        {elegido ? (
          <>
            <p className={estilos.fichaEtiqueta}>País seleccionado · {anio}</p>
            <p className={estilos.fichaNombre}>{elegido.pais}</p>
            {elegido.sin_datos && (
              <p className={estilos.fichaAyuda}>Our World in Data no publica emisiones de este territorio.</p>
            )}
            {!elegido.sin_datos && <dl className={estilos.fichaDatos}>
              <dt>CO₂ por persona</dt>
              <dd>{numero(elegido.co2_pc, 1)} t</dd>
              <dt>CO₂ total</dt>
              <dd>{numero(elegido.co2, 0)} Mt</dd>
              <dt>Población</dt>
              <dd>{poblacion(elegido.poblacion)}</dd>
              <dt>Cambio vs {ANIO_MIN}</dt>
              <dd className={cambio != null && cambio < 0 ? estilos.fichaBaja : estilos.fichaSube}>
                {cambioConFlecha(cambio)}
              </dd>
            </dl>}
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
