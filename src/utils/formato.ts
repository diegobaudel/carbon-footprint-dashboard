const MENOS = '−' // signo menos tipográfico

/**
 * Formateadores reutilizados: crear un Intl.NumberFormat es caro (toLocaleString crea uno
 * nuevo en cada llamada) y numero() se llama miles de veces por segundo durante las
 * animaciones y en los ejes de las gráficas.
 */
const formateadores = new Map<number, Intl.NumberFormat>()
function formateador(decimales: number): Intl.NumberFormat {
  let f = formateadores.get(decimales)
  if (!f) {
    f = new Intl.NumberFormat('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    formateadores.set(decimales, f)
  }
  return f
}

/** Número con separador de miles y `decimales` fijos (formato es-MX). */
export function numero(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  return formateador(decimales).format(valor).replace('-', MENOS)
}

/** Porcentaje con signo explícito: +3.2 % / −4.1 %. */
export function porcentaje(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  const signo = valor > 0 ? '+' : ''
  return `${signo}${numero(valor, decimales)} %`
}

/**
 * Cambio con flecha en lugar de signo: ▼ 0.7 % (bajó) / ▲ 6.1 % (subió).
 * La flecha ya dice la dirección, así que el número va sin + ni −.
 */
export function cambioConFlecha(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  return `${valor < 0 ? '▼' : '▲'} ${numero(Math.abs(valor), decimales)} %`
}

/** Población abreviada: 1.4 mil M, 128.5 M, 850 mil. */
export function poblacion(valor: number | null | undefined): string {
  if (valor == null) return '—'
  if (valor >= 1e9) return `${numero(valor / 1e9, 2)} mil M`
  if (valor >= 1e6) return `${numero(valor / 1e6, 1)} M`
  return `${numero(valor / 1e3, 0)} mil`
}

/** Dinero abreviado para el eje de PIB: $1.2 k, $45 k. */
export function dolares(valor: number): string {
  if (valor >= 1000) return `$${numero(valor / 1000, valor >= 10000 ? 0 : 1)} k`
  return `$${numero(valor, 0)}`
}
