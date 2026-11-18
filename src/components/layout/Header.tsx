import { useMemo, useState, useTransition } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import { ANIO_MAX, ANIO_MIN, CONTINENTES, type RegistroPais } from '../../types.ts'
import estilos from './Header.module.css'

interface Props {
  paises: RegistroPais[]
}

/**
 * Fila 0 del wireframe: título, subtítulo y los tres filtros globales.
 * Se queda fijo arriba al hacer scroll, con una franja que dice qué filtros están activos.
 */
export function Header({ paises }: Props) {
  const { anio, continente, pais, setAnio, setContinente, setPais } = useFiltros()

  // El año se mueve en dos tiempos: el número y el deslizador cambian al instante
  // (anioVisible) y el resto del dashboard se recalcula como transición de React,
  // que se puede interrumpir. Así arrastrar el deslizador no se traba.
  // Todos los cambios de año pasan por este componente, por eso basta el estado local.
  const [anioVisible, setAnioVisible] = useState(anio)
  const [, iniciarTransicion] = useTransition()

  function cambiarAnio(nuevo: number) {
    const valor = Math.min(ANIO_MAX, Math.max(ANIO_MIN, nuevo))
    setAnioVisible(valor)
    iniciarTransicion(() => setAnio(valor))
  }

  // Lista de países del desplegable, limitada al continente elegido
  const opcionesPais = useMemo(() => {
    const vistos = new Map<string, string>()
    for (const r of paises) {
      if (continente === 'Todos' || r.continente === continente) vistos.set(r.iso, r.pais)
    }
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1], 'es'))
  }, [paises, continente])

  const nombrePais = pais === 'Todos' ? null : (paises.find((p) => p.iso === pais)?.pais ?? pais)
  const hayFiltrosActivos = continente !== 'Todos' || pais !== 'Todos' || anioVisible !== ANIO_MAX

  function limpiarFiltros() {
    setContinente('Todos')
    setPais('Todos')
    cambiarAnio(ANIO_MAX)
  }

  return (
    <div className={estilos.fijo}>
      <header className={estilos.header}>
        <div>
          <h1 className={estilos.titulo}>Huella de Carbono: ¿Quién contamina más?</h1>
          <p className={estilos.subtitulo}>
            Emisiones de CO₂, PIB y población · {ANIO_MIN}–{ANIO_MAX} · Fuente: Our World in Data
          </p>
        </div>

        <div className={estilos.filtros}>
          <div className={estilos.filtroAnio}>
            <span>Año</span>
            <div className={estilos.controlAnio}>
              <button
                type="button"
                className={estilos.pasoAnio}
                onClick={() => cambiarAnio(anioVisible - 1)}
                disabled={anioVisible <= ANIO_MIN}
                aria-label="Año anterior"
                title="Año anterior"
              >
                ‹
              </button>
              <strong>{anioVisible}</strong>
              <button
                type="button"
                className={estilos.pasoAnio}
                onClick={() => cambiarAnio(anioVisible + 1)}
                disabled={anioVisible >= ANIO_MAX}
                aria-label="Año siguiente"
                title="Año siguiente"
              >
                ›
              </button>
            </div>
            <input
              type="range"
              className={estilos.deslizador}
              min={ANIO_MIN}
              max={ANIO_MAX}
              value={anioVisible}
              onChange={(e) => cambiarAnio(Number(e.target.value))}
              aria-label="Año"
            />
            <span className={estilos.extremos}>
              <span>{ANIO_MIN}</span>
              <span>{ANIO_MAX}</span>
            </span>
          </div>

          <label className={estilos.filtro}>
            Continente
            <select
              className={estilos.select}
              value={continente}
              onChange={(e) => setContinente(e.target.value as typeof continente)}
            >
              <option value="Todos">Todos</option>
              {CONTINENTES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className={estilos.filtro}>
            País
            <select className={estilos.select} value={pais} onChange={(e) => setPais(e.target.value)}>
              <option value="Todos">Todos</option>
              {opcionesPais.map(([iso, nombre]) => (
                <option key={iso} value={iso}>
                  {nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {/* Indicador de filtros activos: deja claro qué está mostrando todo el dashboard */}
      <div className={estilos.indicador} aria-live="polite">
        <span>Mostrando:</span>
        <span className={estilos.chip}>
          Año {anioVisible}
          {anioVisible !== ANIO_MAX && (
            <button type="button" onClick={() => cambiarAnio(ANIO_MAX)} aria-label={`Volver a ${ANIO_MAX}`}>
              ✕
            </button>
          )}
        </span>
        {continente === 'Todos' && pais === 'Todos' && <span className={estilos.chip}>Vista global</span>}
        {continente !== 'Todos' && (
          <span className={estilos.chip}>
            {continente}
            <button type="button" onClick={() => setContinente('Todos')} aria-label="Quitar filtro de continente">
              ✕
            </button>
          </span>
        )}
        {nombrePais && (
          <span className={estilos.chip}>
            {nombrePais}
            <button type="button" onClick={() => setPais('Todos')} aria-label="Quitar filtro de país">
              ✕
            </button>
          </span>
        )}
        {hayFiltrosActivos && (
          <button type="button" className={estilos.botonLimpiar} onClick={limpiarFiltros}>
            Restablecer todo
          </button>
        )}
      </div>
    </div>
  )
}
