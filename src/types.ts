/** Una fila de public/data/paises.json (un país en un año). Generado por scripts/clean.py. */
export interface RegistroPais {
  iso: string
  /** Código ISO alfa-2, para traducir el nombre del país. */
  iso2: string | null
  /** Nombre en español (se traduce al cargar; OWID lo trae en inglés). */
  pais: string
  continente: Continente | null
  anio: number
  poblacion: number
  pib: number | null
  pib_pc: number | null
  co2: number | null // Mt
  co2_pc: number | null // t por habitante
  carbon: number | null
  petroleo: number | null
  gas: number | null
  cemento: number | null
  flaring: number | null
  en_dispersion: boolean
}

/** Una fila de public/data/agregados.json (Mundo o un continente en un año). */
export interface RegistroAgregado {
  pais: string // nombre original de OWID (World, Asia…)
  nombre: string // nombre en español (Mundo, Asia…)
  anio: number
  poblacion: number
  co2: number | null
  co2_pc: number | null
  carbon: number | null
  petroleo: number | null
  gas: number | null
  cemento: number | null
  flaring: number | null
}

export const CONTINENTES = [
  'África',
  'Asia',
  'Europa',
  'Norteamérica',
  'Sudamérica',
  'Oceanía',
] as const

export type Continente = (typeof CONTINENTES)[number]

export const ANIO_MIN = 2010
export const ANIO_MAX = 2023
/** OWID no publica PIB después de 2022: la dispersión usa este año como tope. */
export const ANIO_MAX_PIB = 2022
