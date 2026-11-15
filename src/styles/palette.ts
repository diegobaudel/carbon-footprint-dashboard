/**
 * La misma paleta de palette.css, para las librerías que piden el color
 * como texto (Recharts, react-simple-maps). Si cambia un color, cambia en los dos.
 */
export const colores = {
  marino: '#1B2A4A',
  fondo: '#F7F7F5',
  tarjeta: '#FFFFFF',
  textoSec: '#6B7280',
  borde: '#E5E7EB',
  emision: '#C65D21',
  mejora: '#0F766E',
  sinDato: '#D1D5DB',
} as const

/** Escala del mapa, de menos a más CO₂ per cápita. */
export const escalaMapa = ['#F9E0C7', '#F2B880', '#C65D21', '#8B4513', '#4A2C1A'] as const

/** Umbrales de la escala del mapa (t CO₂/hab): <1, 1–3, 3–6, 6–10, ≥10. */
export const cortesMapa = [1, 3, 6, 10] as const

/**
 * Seis tonos para las líneas por continente. El melocotón de la escala es muy claro
 * para una línea sobre blanco, así que se usa el azul marino de la paleta en su lugar;
 * además cada línea cambia de trazo (sólida, punteada, discontinua).
 */
export const tonosSeries = ['#4A2C1A', '#8B4513', '#C65D21', '#F2B880', '#1B2A4A', '#6B7280'] as const

/** Colores de las barras apiladas por fuente: escala naranja-café + gris. */
export const coloresFuente = {
  carbon: '#4A2C1A',
  petroleo: '#8B4513',
  gas: '#C65D21',
  cemento: '#F2B880',
  flaring: '#D1D5DB',
} as const
