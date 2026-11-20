/**
 * Descargas del dashboard: CSV de los datos de cada gráfica y PNG de la gráfica tal
 * como se ve (tema claro u oscuro). Todo se arma en el navegador, sin servicios externos.
 */

export type Fila = Record<string, string | number | boolean | null | undefined>

function bajar(blob: Blob, archivo: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = archivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Nombre de archivo sin acentos ni espacios: "Ranking de países" → "ranking-de-paises". */
export function nombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** CSV con encabezados; lleva BOM para que Excel respete los acentos. */
export function descargarCSV(nombre: string, filas: Fila[]) {
  if (filas.length === 0) return
  const columnas = Object.keys(filas[0])
  const celda = (v: Fila[string]) => {
    if (v == null) return ''
    const t = String(v)
    return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  const texto = [columnas.join(','), ...filas.map((f) => columnas.map((c) => celda(f[c])).join(','))].join('\r\n')
  bajar(new Blob(['﻿' + texto], { type: 'text/csv;charset=utf-8' }), `${nombreArchivo(nombre)}.csv`)
}

/** Cambia var(--x) por su valor actual: fuera de la página el SVG no conoce las variables CSS. */
function resolverVariables(svg: string): string {
  const estilo = getComputedStyle(document.documentElement)
  return svg.replace(/var\((--[\w-]+)\)/g, (_, nombre: string) => estilo.getPropertyValue(nombre).trim() || '#888')
}

function color(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()
}

/**
 * PNG de la gráfica de Recharts que hay dentro de `tarjeta`: título, subtítulo, leyenda,
 * la gráfica y la fuente al pie. Escala 2× para que se vea nítida en documentos.
 */
export async function descargarPNG(nombre: string, tarjeta: HTMLElement, titulo: string, subtitulo?: string) {
  const svgs = [...tarjeta.querySelectorAll<SVGSVGElement>('svg.recharts-surface')]
  const svg = svgs.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0]
  if (!svg) return
  const ancho = svg.clientWidth
  const alto = svg.clientHeight

  const copia = svg.cloneNode(true) as SVGSVGElement
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copia.setAttribute('width', String(ancho))
  copia.setAttribute('height', String(alto))
  copia.setAttribute('style', `font-family: 'IBM Plex Sans', system-ui, sans-serif; font-size: 12px;`)
  const fuente = resolverVariables(new XMLSerializer().serializeToString(copia))
  const imagen = new Image()
  imagen.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fuente)}`
  await imagen.decode()

  // Leyenda HTML de Recharts (si la hay): se dibuja como fila de colores
  const leyenda = [...tarjeta.querySelectorAll<HTMLElement>('.recharts-legend-item')].map((item) => ({
    texto: item.textContent?.trim() ?? '',
    color: item.querySelector('path, rect')?.getAttribute('fill') ?? item.querySelector('path')?.getAttribute('stroke') ?? '#888',
  }))

  const margen = 24
  const altoEncabezado = subtitulo ? 64 : 44
  const altoLeyenda = leyenda.length ? 26 : 0
  const altoPie = 28
  const escala = 2
  const lienzo = document.createElement('canvas')
  lienzo.width = (ancho + margen * 2) * escala
  lienzo.height = (alto + altoEncabezado + altoLeyenda + altoPie + margen) * escala
  const ctx = lienzo.getContext('2d')
  if (!ctx) return
  ctx.scale(escala, escala)
  ctx.fillStyle = color('--color-tarjeta') || '#ffffff'
  ctx.fillRect(0, 0, lienzo.width, lienzo.height)
  // franja naranja del tema
  ctx.fillStyle = color('--color-emision') || '#c65d21'
  ctx.fillRect(0, 0, ancho + margen * 2, 4)

  ctx.fillStyle = color('--color-texto') || '#1b2a4a'
  ctx.font = `600 18px 'IBM Plex Serif', Georgia, serif`
  ctx.fillText(titulo, margen, margen + 14)
  if (subtitulo) {
    ctx.fillStyle = color('--color-texto-sec') || '#6b7280'
    ctx.font = `13px 'IBM Plex Sans', system-ui, sans-serif`
    ctx.fillText(subtitulo, margen, margen + 36)
  }

  let x = margen
  const yLeyenda = altoEncabezado + 10
  ctx.font = `12px 'IBM Plex Sans', system-ui, sans-serif`
  for (const l of leyenda) {
    ctx.fillStyle = resolverVariables(l.color)
    ctx.fillRect(x, yLeyenda - 9, 10, 10)
    ctx.fillStyle = color('--color-texto-sec') || '#6b7280'
    ctx.fillText(l.texto, x + 14, yLeyenda)
    x += ctx.measureText(l.texto).width + 30
  }

  ctx.drawImage(imagen, margen, altoEncabezado + altoLeyenda, ancho, alto)

  ctx.fillStyle = color('--color-texto-sec') || '#6b7280'
  ctx.font = `11px 'IBM Plex Sans', system-ui, sans-serif`
  ctx.fillText(
    'Fuente: Our World in Data (CO₂ and Greenhouse Gas Emissions) · Huella de Carbono, Visualización de Datos UCARIBE',
    margen,
    altoEncabezado + altoLeyenda + alto + 20,
  )

  lienzo.toBlob((blob) => blob && bajar(blob, `${nombreArchivo(nombre)}.png`), 'image/png')
}
