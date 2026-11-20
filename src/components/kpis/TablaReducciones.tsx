import { useMemo } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import { useSeleccionPais } from '../../hooks/useSeleccionPais.ts'
import { ANIO_MAX, ANIO_MIN, type RegistroPais } from '../../types.ts'
import { cambioPct, delContinente } from '../../utils/calculos.ts'
import { cambioConFlecha, numero } from '../../utils/formato.ts'
import { Modal } from '../layout/Modal.tsx'
import estilos from './TablaReducciones.module.css'

const UMBRAL_MT = 10
const FILAS = 15

/**
 * Tabla de los países con mayor reducción relativa de CO₂ desde 2010 (los que emitían
 * más de 10 Mt en 2010): la vista completa sin tener que mover el deslizador año con año.
 */
export function TablaReducciones({ paises, onCerrar }: { paises: RegistroPais[]; onCerrar: () => void }) {
  const { anio, continente } = useFiltros()
  const seleccionar = useSeleccionPais()
  const fin = anio > ANIO_MIN ? anio : ANIO_MAX

  const filas = useMemo(() => {
    const porPais = new Map<string, RegistroPais[]>()
    for (const p of delContinente(paises, continente)) {
      if (p.sin_datos) continue
      const lista = porPais.get(p.iso) ?? []
      lista.push(p)
      porPais.set(p.iso, lista)
    }
    const resultado = []
    for (const lista of porPais.values()) {
      lista.sort((a, b) => a.anio - b.anio)
      const inicio = lista.find((p) => p.anio === ANIO_MIN)
      const final = lista.find((p) => p.anio === fin)
      if (!inicio?.co2 || inicio.co2 <= UMBRAL_MT || final?.co2 == null) continue
      resultado.push({
        registro: final,
        inicio: inicio.co2,
        final: final.co2,
        cambio: cambioPct(inicio.co2, final.co2) as number,
      })
    }
    return resultado.sort((a, b) => a.cambio - b.cambio).slice(0, FILAS)
  }, [paises, continente, fin])

  return (
    <Modal
      titulo="Mayor reducción relativa de CO₂"
      subtitulo={`${FILAS} países con la mayor baja de ${ANIO_MIN} a ${fin} · solo los que emitían más de ${UMBRAL_MT} Mt en ${ANIO_MIN}${
        continente !== 'Todos' ? ` · ${continente}` : ''
      } · clic en un país para elegirlo`}
      onCerrar={onCerrar}
    >
      <table className={estilos.tabla}>
        <thead>
          <tr>
            <th>#</th>
            <th>País</th>
            <th className={estilos.num}>{ANIO_MIN} (Mt)</th>
            <th className={estilos.num}>{fin} (Mt)</th>
            <th className={estilos.num}>Cambio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr
              key={f.registro.iso}
              onClick={() => {
                seleccionar(f.registro.iso, f.registro.continente)
                onCerrar()
              }}
            >
              <td className={estilos.lugar}>{i + 1}</td>
              <td className={estilos.pais}>{f.registro.pais}</td>
              <td className={estilos.num}>{numero(f.inicio, f.inicio < 100 ? 1 : 0)}</td>
              <td className={estilos.num}>{numero(f.final, f.final < 100 ? 1 : 0)}</td>
              <td className={`${estilos.num} ${f.cambio < 0 ? estilos.baja : estilos.sube}`}>{cambioConFlecha(f.cambio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filas.length === 0 && <p className={estilos.vacio}>No hay países que cumplan el criterio con estos filtros.</p>}
    </Modal>
  )
}
