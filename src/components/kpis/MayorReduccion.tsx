import { useState } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import type { RegistroPais } from '../../types.ts'
import { ANIO_MIN } from '../../types.ts'
import { mayorReduccion } from '../../utils/calculos.ts'
import { porcentaje } from '../../utils/formato.ts'
import { Tarjeta } from '../layout/Tarjeta.tsx'
import { NumeroAnimado } from '../layout/NumeroAnimado.tsx'
import { IconoInfo } from '../layout/Iconos.tsx'
import { TablaReducciones } from './TablaReducciones.tsx'
import estilos from './Kpi.module.css'

const UMBRAL_MT = 10

/** KPI secundario: país con mayor reducción relativa de CO₂ entre 2010 y el año filtrado. */
export function MayorReduccion({ paises }: { paises: RegistroPais[] }) {
  const { anio, continente } = useFiltros()
  const resultado = mayorReduccion(paises, anio, continente, UMBRAL_MT)
  // ⓘ abre la tabla con los 15 países que más redujeron y su tendencia 2010–2023
  const [verTabla, setVerTabla] = useState(false)

  return (
    <Tarjeta
      titulo="Mayor reducción relativa"
      acciones={
        <button
          type="button"
          className={estilos.botonTabla}
          onClick={() => setVerTabla(true)}
          title="Ver tabla: países con mayor reducción y su tendencia 2010–2023"
          aria-label="Ver tabla de países con mayor reducción"
        >
          <IconoInfo tamano={15} />
        </button>
      }
    >
      {verTabla && <TablaReducciones paises={paises} onCerrar={() => setVerTabla(false)} />}
      {resultado ? (
        <div>
          {/* El nombre "destella" cuando cambia el país; la cifra cuenta hasta el nuevo valor */}
          <p key={resultado.pais.iso} className={`${estilos.nombrePais} ${estilos.destello}`} title={resultado.pais.pais}>
            {resultado.pais.pais}
          </p>
          <p className={`${estilos.valor} ${resultado.cambio < 0 ? estilos.mejora : estilos.aumento}`}>
            <NumeroAnimado valor={resultado.cambio} formato={porcentaje} />
          </p>
        </div>
      ) : (
        <p className={estilos.etiqueta}>Elige un año posterior a {ANIO_MIN} para comparar.</p>
      )}
      <p className={estilos.notaLinea}>
        Países con más de {UMBRAL_MT} Mt en {ANIO_MIN} · {ANIO_MIN}→{anio}
      </p>
    </Tarjeta>
  )
}
