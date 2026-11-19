import estilos from './Seccion.module.css'

interface Props {
  numero: string
  titulo: string
  texto: string
}

/**
 * Título de sección estilo reportaje ("01 Panorama"). Ocupa una fila completa de la
 * cuadrícula y no mueve las tarjetas: cada sección corresponde a una fila del wireframe.
 */
export function Seccion({ numero, titulo, texto }: Props) {
  return (
    <div className={estilos.seccion}>
      <span className={estilos.numero}>{numero}</span>
      <h2 className={estilos.titulo}>{titulo}</h2>
      <p className={estilos.texto}>{texto}</p>
    </div>
  )
}
