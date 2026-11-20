import { colores } from '../../styles/palette.ts'

/** Estilo común de ejes y tooltips de Recharts (nivel 3: gris, 11 px). */
export const ticks = { fontSize: 11, fill: colores.textoSec }
/** Línea de los ejes X e Y: gris de texto secundario (en oscuro el gris de borde casi no se veía). */
export const lineaEje = { stroke: colores.textoSec, strokeOpacity: 0.7 }
export const estiloTooltip = {
  fontSize: 12,
  borderRadius: 8,
  borderColor: colores.borde,
  backgroundColor: colores.tarjeta,
  color: colores.texto,
}

/** Título del eje X (abajo, centrado). La gráfica necesita ~18 px de margen inferior. */
export function tituloX(texto: string) {
  return { value: texto, position: 'insideBottom' as const, offset: -12, fontSize: 11, fill: colores.textoSec }
}

/** Título del eje Y (vertical, a la izquierda). El eje necesita ~16 px más de ancho. */
export function tituloY(texto: string) {
  return {
    value: texto,
    angle: -90,
    position: 'insideLeft' as const,
    offset: 2,
    fontSize: 11,
    fill: colores.textoSec,
    style: { textAnchor: 'middle' as const },
  }
}
