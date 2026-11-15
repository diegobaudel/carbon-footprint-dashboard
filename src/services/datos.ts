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
