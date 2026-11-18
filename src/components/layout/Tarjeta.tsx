import { useState, type ReactNode } from 'react'
import estilos from './Tarjeta.module.css'

interface Props {
  titulo?: string
  subtitulo?: string
  /** Controles a la derecha del título (ej. el switch Total / Per cápita). */
  acciones?: ReactNode
  /** Explicación metodológica o nota de ayuda que se muestra al pasar el cursor o hacer clic en el icono (ⓘ). */
  infoAyuda?: string
  /** Clase extra para colocar la tarjeta en la cuadrícula. */
  className?: string
  children: ReactNode
}

/** Tarjeta blanca del wireframe: radio 12 px, borde #E5E7EB, sombra suave, padding 20 px. */
export function Tarjeta({ titulo, subtitulo, acciones, infoAyuda, className, children }: Props) {
  const [mostrarAyuda, setMostrarAyuda] = useState(false)

  return (
    <section className={`${estilos.tarjeta} ${className ?? ''}`}>
      {(titulo || acciones || infoAyuda) && (
        <header className={estilos.encabezado}>
          <div className={estilos.tituloContenedor}>
            <div>
              {titulo && <h2 className={estilos.titulo}>{titulo}</h2>}
              {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
            </div>
            
            {/* Botón e icono de ayuda metodológica */}
            {infoAyuda && (
              <div className={estilos.wrapperAyuda}>
                <button 
                  className={estilos.botonAyuda}
                  onClick={() => setMostrarAyuda(!mostrarAyuda)}
                  title="Información metodológica"
                  type="button"
                >
                  ⓘ
                </button>
                {mostrarAyuda && (
                  <div className={estilos.tooltipAyuda}>
                    {infoAyuda}
                  </div>
                )}
              </div>
            )}
          </div>

          {acciones && <div className={estilos.acciones}>{acciones}</div>}
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