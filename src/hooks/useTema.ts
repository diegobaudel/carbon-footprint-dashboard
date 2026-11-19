import { useSyncExternalStore } from 'react'

/**
 * Tema actual ('claro' | 'oscuro'), leído de <html data-tema>. Lo usan los
 * componentes que no pueden pintar con variables CSS (las teselas del mapa).
 */
export function useTema(): 'claro' | 'oscuro' {
  return useSyncExternalStore(
    (avisar) => {
      const obs = new MutationObserver(avisar)
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] })
      return () => obs.disconnect()
    },
    () => (document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro'),
    () => 'claro',
  )
}
