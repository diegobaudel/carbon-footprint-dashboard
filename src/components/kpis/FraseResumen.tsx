import type { ReactNode } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import { ANIO_MIN, type RegistroAgregado, type RegistroPais } from '../../types.ts'
import { cambioPct, topPaises } from '../../utils/calculos.ts'
import { numero } from '../../utils/formato.ts'
import estilos from './FraseResumen.module.css'

interface Props {
  paises: RegistroPais[]
  agregados: RegistroAgregado[]
  className?: string
}

/** "subieron 12.3 %" / "bajaron 4.1 %" / "se mantuvieron" */
function tendencia(cambio: number | null): ReactNode {
  if (cambio == null) return null
  if (Math.abs(cambio) < 0.5) return 'se mantuvieron casi iguales'
  return (
    <>
      {cambio > 0 ? 'subieron ' : 'bajaron '}
      <strong className={cambio > 0 ? estilos.sube : estilos.baja}>{numero(Math.abs(cambio), 1)} %</strong>
    </>
  )
}

/**
 * Frase automática que resume lo que muestra el dashboard con los filtros actuales
 * (mundo, continente o país). Todo sale de los mismos datos de los KPIs.
 */
export function FraseResumen({ paises, agregados, className }: Props) {
  const { anio, continente, pais } = useFiltros()
  const agregado = (nombre: string, a: number) => agregados.find((x) => x.nombre === nombre && x.anio === a)
  const mundo = agregado('Mundo', anio)
  const total = mundo?.co2 ?? null
  const desde = anio > ANIO_MIN

  let frase: ReactNode = null

  if (pais !== 'Todos') {
    const r = paises.find((p) => p.iso === pais && p.anio === anio)
    if (!r || r.co2 == null) {
      frase = (
        <>
          Our World in Data no publica emisiones de <strong>{r?.pais ?? pais}</strong>. Elige otro país o
          quita el filtro para volver a la vista global.
        </>
      )
    } else {
      const ranking = topPaises(paises, anio, 'Todos', 'co2', 1000)
      const lugar = ranking.findIndex((p) => p.iso === pais) + 1
      const base = paises.find((p) => p.iso === pais && p.anio === ANIO_MIN)
      const veces = r.co2_pc != null && mundo?.co2_pc ? r.co2_pc / mundo.co2_pc : null
      frase = (
        <>
          En {anio}, <strong>{r.pais}</strong> emitió <strong>{numero(r.co2, r.co2 < 10 ? 1 : 0)} Mt</strong> de CO₂,
          el <strong>{numero(total ? (r.co2 / total) * 100 : null, 1)} %</strong> del total mundial
          {lugar > 0 && ` (lugar ${lugar} de ${ranking.length} países)`}.
          {veces != null && (
            <>
              {' '}
              Cada habitante emitió <strong>{numero(r.co2_pc, 1)} t</strong>,{' '}
              {veces >= 1.05 ? (
                <>
                  <strong>{numero(veces, 1)} veces</strong> el promedio mundial
                </>
              ) : veces <= 0.95 ? (
                <>
                  el <strong>{numero(veces * 100, 0)} %</strong> del promedio mundial
                </>
              ) : (
                'casi igual al promedio mundial'
              )}
              .
            </>
          )}
          {desde && base?.co2 != null && <> Desde {ANIO_MIN} sus emisiones {tendencia(cambioPct(base.co2, r.co2))}.</>}
        </>
      )
    }
  } else if (continente !== 'Todos') {
    const c = agregado(continente, anio)
    const c0 = agregado(continente, ANIO_MIN)
    const mayor = topPaises(paises, anio, continente, 'co2', 1)[0]
    if (c?.co2 != null) {
      frase = (
        <>
          En {anio}, <strong>{continente}</strong> emitió <strong>{numero(c.co2, 0)} Mt</strong> de CO₂, el{' '}
          <strong>{numero(total ? (c.co2 / total) * 100 : null, 1)} %</strong> del mundo
          {mayor?.co2 != null && (
            <>
              ; su mayor emisor fue <strong>{mayor.pais}</strong> con {numero(mayor.co2, 0)} Mt (
              {numero((mayor.co2 / c.co2) * 100, 0)} % del continente)
            </>
          )}
          .{desde && <> Desde {ANIO_MIN} sus emisiones {tendencia(cambioPct(c0?.co2, c.co2))}.</>}
        </>
      )
    }
  } else if (mundo?.co2 != null) {
    const top3 = topPaises(paises, anio, 'Todos', 'co2', 3)
    const suma = top3.reduce((s, p) => s + (p.co2 ?? 0), 0)
    frase = (
      <>
        En {anio}, el mundo emitió <strong>{numero(mundo.co2, 0)} Mt</strong> de CO₂ (
        <strong>{numero(mundo.co2_pc, 1)} t</strong> por persona)
        {desde && <>; desde {ANIO_MIN} las emisiones {tendencia(cambioPct(agregado('Mundo', ANIO_MIN)?.co2, mundo.co2))}</>}.
        {top3.length === 3 && (
          <>
            {' '}
            Solo <strong>{top3[0].pais}</strong>, <strong>{top3[1].pais}</strong> y <strong>{top3[2].pais}</strong>{' '}
            sumaron el <strong>{numero((suma / mundo.co2) * 100, 0)} %</strong> del total.
          </>
        )}
      </>
    )
  }

  if (!frase) return null
  return (
    <p className={`${estilos.frase} ${className ?? ''}`} aria-live="polite">
      <span className={estilos.etiqueta}>En resumen</span>
      <span>{frase}</span>
    </p>
  )
}
