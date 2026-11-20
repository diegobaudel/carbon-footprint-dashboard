import { useConteo } from '../../hooks/useMovimiento.ts'

interface Props {
  valor: number | null | undefined
  /** Cómo se escribe la cifra (numero, porcentaje…). Recibe null si no hay dato. */
  formato: (valor: number | null) => string
}

/** Cifra de KPI que cuenta hasta su valor al aparecer y al cambiar de filtro. */
export function NumeroAnimado({ valor, formato }: Props) {
  return <>{formato(useConteo(valor))}</>
}
