import { useRef, useState, type ReactNode } from 'react'
import { descargarCSV, descargarPNG, type Fila } from '../../utils/descargas.ts'
import { IconoDescarga } from './Iconos.tsx'
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
  /**
   * Botones de descarga en el encabezado: CSV con `filas()` (los datos que se ven) y,
   * si `imagen` es true, PNG de la gráfica.
   */
  descarga?: { nombre: string; filas: () => Fila[]; imagen?: boolean }
  children: ReactNode
}

/** Tarjeta blanca del wireframe: radio 12 px, borde #E5E7EB, sombra suave, padding 20 px. */
export function Tarjeta({ titulo, subtitulo, acciones, infoAyuda, className, descarga, children }: Props) {
  const [mostrarAyuda, setMostrarAyuda] = useState(false)
  const seccion = useRef<HTMLElement>(null)

  return (
    <section ref={seccion} className={`${estilos.tarjeta} ${className ?? ''}`}>
      {(titulo || acciones || infoAyuda || descarga) && (
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

          {(acciones || descarga) && (
            <div className={estilos.acciones}>
              {acciones}
              {descarga && (
                <div className={estilos.descargas} role="group" aria-label="Descargar">
                  {descarga.imagen && (
                    <button
                      type="button"
                      className={estilos.botonDescarga}
                      title="Descargar la gráfica como imagen (PNG)"
                      onClick={() =>
                        seccion.current &&
                        descargarPNG(descarga.nombre, seccion.current, titulo ?? descarga.nombre, subtitulo)
                      }
                    >
                      <IconoDescarga tamano={13} />
                      PNG
                    </button>
                  )}
                  <button
                    type="button"
                    className={estilos.botonDescarga}
                    title="Descargar los datos de esta gráfica (CSV, abre en Excel)"
                    onClick={() => descargarCSV(descarga.nombre, descarga.filas())}
                  >
                    <IconoDescarga tamano={13} />
                    CSV
                  </button>
                </div>
              )}
            </div>
          )}
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