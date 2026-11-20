/**
 * La misma paleta de palette.css, para las librerías que piden el color
 * como texto (Recharts, react-simple-maps). Si cambia un color, cambia en los dos.
 */
export const colores = {
  // Estructura: apuntan a las variables CSS para que cambien con el modo oscuro
  texto: 'var(--color-texto)',
  textoSec: 'var(--color-texto-sec)',
  borde: 'var(--color-borde)',
  fondo: 'var(--color-fondo)',
  tarjeta: 'var(--color-tarjeta)',
  destacado: 'var(--color-destacado)',
  mejora: 'var(--color-mejora)',
  sinDato: 'var(--color-sin-dato)',
  contorno: 'var(--color-contorno)',
  oceano: 'var(--color-mapa-oceano)',
  // Datos: iguales en los dos modos
  emision: '#C65D21',
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
export const tonosSeries = [
  'var(--serie-1)',
  'var(--serie-2)',
  'var(--serie-3)',
  'var(--serie-4)',
  'var(--serie-5)',
  'var(--serie-6)',
] as const

/**
 * Colores de las barras apiladas por fuente: escala naranja-café + gris.
 * Van como variables porque en modo oscuro los cafés oscuros casi no se veían sobre la
 * tarjeta (1.3:1); ahí la escala se invierte hacia los tonos claros (ver palette.css).
 */
export const coloresFuente = {
  carbon: 'var(--fuente-carbon)',
  petroleo: 'var(--fuente-petroleo)',
  gas: 'var(--fuente-gas)',
  cemento: 'var(--fuente-cemento)',
  flaring: 'var(--fuente-flaring)',
} as const
