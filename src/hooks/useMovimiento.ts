import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** Duración de la animación de entrada de las gráficas (ms). */
export const DURACION_ENTRADA = 900

/** true si la persona pidió "reducir movimiento" en su sistema: entonces no se anima nada. */
const consulta =
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : undefined
export function menosMovimiento(): boolean {
  return consulta?.matches ?? false
}

/**
 * Cifra que "cuenta" hasta su valor: de 0 al montarse y del valor anterior al nuevo
 * cuando cambia un filtro. Escribe en el elemento del ref con textContent en cada cuadro,
 * sin estado de React; el dato final es el mismo que pinta React.
 */
export function useConteo(valor: number | null | undefined, formato: (v: number | null) => string, duracion = 700) {
  const ref = useRef<HTMLSpanElement>(null)
  const desde = useRef<number | null>(null)
  const formatoRef = useRef(formato)
  useEffect(() => {
    formatoRef.current = formato
  })

  // useLayoutEffect: el texto queda escrito antes de pintar (no hay un cuadro vacío)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (valor == null) {
      desde.current = null
      el.textContent = formatoRef.current(null)
      return
    }
    const origen = desde.current ?? 0
    const total = menosMovimiento() || origen === valor ? 0 : duracion
    if (total === 0) {
      desde.current = valor
      el.textContent = formatoRef.current(valor)
      return
    }
    const t0 = performance.now()
    let cuadro = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / total)
      const v = origen + (valor - origen) * (1 - (1 - p) ** 3) // ease-out cúbico
      desde.current = v
      el.textContent = formatoRef.current(p < 1 ? v : valor)
      if (p < 1) cuadro = requestAnimationFrame(paso)
    }
    el.textContent = formatoRef.current(origen)
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracion])

  return ref
}

/**
 * Para las gráficas: avisa cuando el contenedor entra en pantalla (visible) y deja la
 * animación de Recharts encendida solo para ese primer dibujo (animar). Después se
 * apaga para que cambiar de año siga siendo instantáneo.
 */
export function useAnimacionEntrada<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  const [animar, setAnimar] = useState(() => !menosMovimiento())

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          observador.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    if (!visible || !animar) return
    const t = setTimeout(() => setAnimar(false), DURACION_ENTRADA + 400)
    return () => clearTimeout(t)
  }, [visible, animar])

  return { ref, visible, animar }
}

/**
 * Las tarjetas aparecen (fade + subida corta) conforme entran en pantalla al hacer scroll.
 * Anima los hijos directos del contenedor; si un hijo tiene data-grupo, anima sus hijos
 * uno por uno (escalonados) en lugar del grupo completo.
 */
export function useRevelarAlScroll(contenedor: RefObject<HTMLElement | null>, listo: boolean) {
  useEffect(() => {
    const raiz = contenedor.current
    if (!listo || !raiz || menosMovimiento()) return
    const piezas = [...raiz.querySelectorAll<HTMLElement>(':scope > :not([data-grupo]), :scope > [data-grupo] > *')]
    piezas.forEach((p) => p.classList.add('revelar'))

    const observador = new IntersectionObserver(
      (entradas) => {
        const nuevas = entradas
          .filter((e) => e.isIntersecting)
          .map((e) => ({ el: e.target as HTMLElement, caja: e.boundingClientRect }))
          .sort((a, b) => a.caja.top - b.caja.top || a.caja.left - b.caja.left)
        nuevas.forEach(({ el }, i) => {
          el.style.setProperty('--retraso', `${Math.min(i, 5) * 80}ms`)
          el.classList.add('revelado')
          observador.unobserve(el)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    piezas.forEach((p) => observador.observe(p))
    return () => observador.disconnect()
  }, [contenedor, listo])
}
