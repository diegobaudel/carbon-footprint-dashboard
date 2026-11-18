import { colores } from '../../styles/palette.ts'

/** Estilo común de ejes y tooltips de Recharts (nivel 3: gris, 11 px). */
export const ticks = { fontSize: 11, fill: colores.textoSec }
export const lineaEje = { stroke: colores.borde }
export const estiloTooltip = {
  fontSize: 12,
  borderRadius: 8,
  borderColor: colores.borde,
  backgroundColor: colores.tarjeta,
  color: colores.texto,
}
