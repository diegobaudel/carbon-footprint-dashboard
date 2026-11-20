import type { RegistroAgregado, RegistroPais } from '../types.ts'

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

export async function cargarPaises(): Promise<RegistroPais[]> {
  const paises = await cargarJson<RegistroPais[]>('paises.json')
  return paises.map((p) => ({ ...p, pais: nombreEnEspanol(p) }))
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
