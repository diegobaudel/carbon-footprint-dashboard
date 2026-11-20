import { useConteo } from '../../hooks/useMovimiento.ts'

interface Props {
  valor: number | null | undefined
  /** Cómo se escribe la cifra (numero, porcentaje…). Recibe null si no hay dato. */
  formato: (valor: number | null) => string
}

/**
 * Cifra de KPI que cuenta hasta su valor al aparecer y al cambiar de filtro.
 * Durante la animación escribe el texto directo en el DOM (sin volver a dibujar el
 * componente en cada cuadro), así no compite con el scroll ni con el globo.
 */
export function NumeroAnimado({ valor, formato }: Props) {
  const ref = useConteo(valor, formato)
  // El texto lo escribe useConteo (React no pone hijos aquí para no pelear por el nodo)
  return <span ref={ref} />
}
