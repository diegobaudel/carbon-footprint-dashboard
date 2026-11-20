import { useEffect, useRef, useState, type RefObject } from 'react'

/** Duración de la animación de entrada de las gráficas (ms). */
export const DURACION_ENTRADA = 900

/** true si la persona pidió "reducir movimiento" en su sistema: entonces no se anima nada. */
export function menosMovimiento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Cifra que "cuenta" hasta su valor: de 0 al montarse y del valor anterior al nuevo
 * cuando cambia un filtro. Solo cambia lo que se ve mientras dura la animación;
 * el dato final es el mismo.
 */
export function useConteo(valor: number | null | undefined, duracion = 700): number | null {
  const inicial = valor == null ? null : menosMovimiento() ? valor : 0
  const [mostrado, setMostrado] = useState<number | null>(inicial)
  const desde = useRef<number | null>(inicial)

  useEffect(() => {
    if (valor == null) {
      desde.current = null
      return
    }
    const origen = desde.current ?? valor
    const total = menosMovimiento() || origen === valor ? 0 : duracion
    const t0 = performance.now()
    let cuadro = 0
    const paso = (t: number) => {
      const p = total === 0 ? 1 : Math.min(1, (t - t0) / total)
      const v = origen + (valor - origen) * (1 - (1 - p) ** 3) // ease-out cúbico
      desde.current = v
      setMostrado(v)
      if (p < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracion])

  return valor == null ? null : mostrado
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
