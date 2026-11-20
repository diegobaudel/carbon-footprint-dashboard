import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import estilos from './Modal.module.css'

interface Props {
  titulo: string
  subtitulo?: string
  onCerrar: () => void
  children: ReactNode
}

/** Ventana sobre el dashboard: se cierra con ✕, con Esc o haciendo clic fuera. */
export function Modal({ titulo, subtitulo, onCerrar, children }: Props) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  // Portal al <body>: así ninguna tarjeta (con overflow o transform) la recorta
  return createPortal(
    <div className={estilos.fondo} onClick={onCerrar}>
      <div className={estilos.caja} role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <header className={estilos.encabezado}>
          <div>
            <h2 className={estilos.titulo}>{titulo}</h2>
            {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
          </div>
          <button type="button" className={estilos.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </header>
        <div className={estilos.cuerpo}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}
