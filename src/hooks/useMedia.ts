import { useSyncExternalStore } from 'react'

/** true mientras la pantalla cumpla la media query (ej. '(max-width: 720px)'). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Atajo para la vista de celular (mismo corte que los CSS: 720 px). */
export function useEsCelular(): boolean {
  return useMedia('(max-width: 720px)')
}
