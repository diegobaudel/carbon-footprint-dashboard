import { ANIO_MAX, ANIO_MIN, type Continente, type RegistroAgregado, type RegistroPais } from '../types.ts'

const base = import.meta.env.BASE_URL

async function cargarJson<T>(archivo: string): Promise<T> {
  const respuesta = await fetch(`${base}data/${archivo}`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${archivo} (${respuesta.status})`)
  }
  return respuesta.json() as Promise<T>
}

const nombresEs = new Intl.DisplayNames(['es'], { type: 'region' })

/** Nombre del país en español; si no hay traducción se deja el de OWID. */
function nombreEnEspanol(registro: RegistroPais): string {
  if (!registro.iso2) return registro.pais
  try {
    return nombresEs.of(registro.iso2) ?? registro.pais
  } catch {
    return registro.pais
  }
}

interface Territorio {
  iso: string
  iso2: string | null
  pais: string
  continente: Continente
}

/**
 * Territorios del mapa sin datos en OWID (los genera scripts/preparar_mapa.py).
 * Se agregan con todas sus cifras en null, uno por año, para que se puedan buscar y
 * elegir igual que cualquier país. No se inventa ningún dato.
 */
function filasSinDatos(t: Territorio): RegistroPais[] {
  const filas: RegistroPais[] = []
  for (let anio = ANIO_MIN; anio <= ANIO_MAX; anio++) {
    filas.push({
      ...t,
      anio,
      poblacion: null,
      pib: null,
      pib_pc: null,
      co2: null,
      co2_pc: null,
      carbon: null,
      petroleo: null,
      gas: null,
      cemento: null,
      flaring: null,
      en_dispersion: false,
      sin_datos: true,
    })
  }
  return filas
}

export async function cargarPaises(): Promise<RegistroPais[]> {
  const [paises, territorios] = await Promise.all([
    cargarJson<RegistroPais[]>('paises.json'),
    cargarJson<Territorio[]>('territorios.json').catch(() => [] as Territorio[]),
  ])
  return [...paises, ...territorios.flatMap(filasSinDatos)].map((p) => ({ ...p, pais: nombreEnEspanol(p) }))
}

export function cargarAgregados(): Promise<RegistroAgregado[]> {
  return cargarJson<RegistroAgregado[]>('agregados.json')
}

/** Coordenada de un país que no tiene forma en el mapa (se dibuja como punto). */
export interface CentroPais {
  iso: string
  lat: number
  lng: number
}

let centrosPequenos: Promise<CentroPais[]> | null = null

/**
 * Países pequeños sin polígono en el TopoJSON 1:110m (Singapur, Malta, islas…).
 * Lo genera scripts/centros_pequenos.py. Se pide una sola vez y lo comparten el globo y el mapa.
 */
export function cargarCentrosPequenos(): Promise<CentroPais[]> {
  centrosPequenos ??= cargarJson<CentroPais[]>('centros-pequenos.json').catch(() => [])
  return centrosPequenos
}
