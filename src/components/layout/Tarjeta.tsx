import type { ReactNode } from 'react'
import estilos from './Tarjeta.module.css'

interface Props {
  titulo?: string
  subtitulo?: string
  /** Controles a la derecha del título (ej. el switch Total / Per cápita). */
  acciones?: ReactNode
  /** Clase extra para colocar la tarjeta en la cuadrícula. */
  className?: string
  children: ReactNode
}

/** Tarjeta blanca del wireframe: radio 12 px, borde #E5E7EB, sombra suave, padding 20 px. */
export function Tarjeta({ titulo, subtitulo, acciones, className, children }: Props) {
  return (
    <section className={`${estilos.tarjeta} ${className ?? ''}`}>
      {(titulo || acciones) && (
        <header className={estilos.encabezado}>
          <div>
            {titulo && <h2 className={estilos.titulo}>{titulo}</h2>}
            {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
          </div>
          {acciones}
        </header>
      )}
      <div className={estilos.cuerpo}>{children}</div>
    </section>
  )
}

/** Hueco reservado para un componente que todavía no se implementa. */
export function Pendiente({ descripcion }: { descripcion: string }) {
  return <div className={estilos.pendiente}>Pendiente · {descripcion}</div>
}
