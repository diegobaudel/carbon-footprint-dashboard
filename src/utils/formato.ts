const MENOS = '−' // signo menos tipográfico

/** Número con separador de miles y `decimales` fijos (formato es-MX). */
export function numero(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  return valor
    .toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
    .replace('-', MENOS)
}

/** Porcentaje con signo explícito: +3.2 % / −4.1 %. */
export function porcentaje(valor: number | null | undefined, decimales = 1): string {
  if (valor == null || Number.isNaN(valor)) return '—'
  const signo = valor > 0 ? '+' : ''
  return `${signo}${numero(valor, decimales)} %`
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
