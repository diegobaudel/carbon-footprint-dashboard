import { Tarjeta } from './Tarjeta.tsx'
import estilos from './NotasMetodologia.module.css'

/** Fila 4, columnas 9–12: información complementaria (nivel 3). */
export function NotasMetodologia({ className }: { className?: string }) {
  return (
    <Tarjeta titulo="Notas y metodología" className={className}>
      <ul className={estilos.lista}>
        <li>Solo CO₂ de combustibles fósiles e industria</li>
        <li>Datos anuales 2010–2023 (PIB disponible hasta 2022)</li>
        <li>Promedio ponderado por población</li>
      </ul>
    </Tarjeta>
  )
}
