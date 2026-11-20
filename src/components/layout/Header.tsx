import { useEffect, useMemo, useState, useTransition } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import { ANIO_MAX, ANIO_MIN, CONTINENTES, type RegistroPais } from '../../types.ts'
import { IconoPausa, IconoPlay } from './Iconos.tsx'
import { BuscadorPais } from './BuscadorPais.tsx'
import estilos from './Header.module.css'

/** Tiempo que se queda cada año al reproducir la serie (ms). */
const PASO_REPRODUCCION = 1000

interface Props {
  paises: RegistroPais[]
}

/**
 * Fila 0 del wireframe: título, subtítulo y los tres filtros globales.
 * Se queda fijo arriba al hacer scroll, con una franja que dice qué filtros están activos.
 */
export function Header({ paises }: Props) {
  const { anio, continente, pais, setAnio, setContinente, setPais, reproduciendo, solicitudReproduccion, reproducir, pausar, detener } =
    useFiltros()

  // El año se mueve en dos tiempos: el número y el deslizador cambian al instante
  // (anioVisible) y el resto del dashboard se recalcula como transición de React,
  // que se puede interrumpir. Así arrastrar el deslizador no se traba.
  // Todos los cambios de año pasan por este componente, por eso basta el estado local.
  const [anioVisible, setAnioVisible] = useState(anio)
  const [, iniciarTransicion] = useTransition()

  // ▶ (desde aquí o desde el botón del mapa) fija el año de inicio en el contexto;
  // el número visible se alinea en el mismo render
  const [solicitudVista, setSolicitudVista] = useState(solicitudReproduccion)
  if (solicitudReproduccion !== solicitudVista) {
    setSolicitudVista(solicitudReproduccion)
    setAnioVisible(anio)
  }

  // Cualquier cambio manual del año detiene la reproducción
  function cambiarAnio(nuevo: number) {
    const valor = Math.min(ANIO_MAX, Math.max(ANIO_MIN, nuevo))
    if (reproduciendo) detener()
    setAnioVisible(valor)
    iniciarTransicion(() => setAnio(valor))
  }

  // ▶ Recorre 2010 → 2023 un año por segundo con todos los países; todo el dashboard
  // se mueve con él
  useEffect(() => {
    if (!reproduciendo) return
    const t = setTimeout(() => {
      if (anioVisible >= ANIO_MAX) {
        detener()
        return
      }
      const siguiente = anioVisible + 1
      setAnioVisible(siguiente)
      iniciarTransicion(() => setAnio(siguiente))
    }, PASO_REPRODUCCION)
    return () => clearTimeout(t)
  }, [reproduciendo, anioVisible, setAnio, detener])

  // Lista de países del desplegable, limitada al continente elegido
  const opcionesPais = useMemo(() => {
    const vistos = new Map<string, string>()
    for (const r of paises) {
      if (continente === 'Todos' || r.continente === continente) vistos.set(r.iso, r.pais)
    }
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1], 'es'))
  }, [paises, continente])

  // Territorios del mapa sin datos en OWID: se pueden elegir, pero la lista lo avisa
  const sinDatos = useMemo(() => new Set(paises.filter((p) => p.sin_datos).map((p) => p.iso)), [paises])

  const nombrePais = pais === 'Todos' ? null : (paises.find((p) => p.iso === pais)?.pais ?? pais)
  const hayFiltrosActivos = continente !== 'Todos' || pais !== 'Todos' || anioVisible !== ANIO_MAX

  function limpiarFiltros() {
    setContinente('Todos')
    setPais('Todos')
    cambiarAnio(ANIO_MAX)
  }

  return (
    <div className={estilos.fijo}>
      {/* Barra de filtros: separada del título, fija arriba al hacer scroll */}
      <div className={estilos.header} role="search" aria-label="Filtros del dashboard">
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
              <button
                type="button"
                className={`${estilos.pasoAnio} ${estilos.reproducir}`}
                onClick={reproduciendo ? pausar : reproducir}
                aria-pressed={reproduciendo}
                aria-label={reproduciendo ? 'Pausar' : `Reproducir ${ANIO_MIN}–${ANIO_MAX}`}
                title={reproduciendo ? 'Pausar' : `Reproducir ${ANIO_MIN}–${ANIO_MAX}`}
              >
                {reproduciendo ? <IconoPausa tamano={12} /> : <IconoPlay tamano={12} />}
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

          {/* País: buscador con lista desplegable (escribe para filtrar, sin importar acentos) */}
          <div className={estilos.filtro}>
            <span aria-hidden="true">País</span>
            <BuscadorPais
              opciones={opcionesPais}
              sinDatos={sinDatos}
              valor={pais}
              onCambiar={setPais}
              claseCampo={estilos.select}
            />
          </div>
        </div>
      </div>

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

/**
 * Título del dashboard (fila 0 del wireframe): grande y fuera de la barra de filtros,
 * para que el tema central se entienda de un vistazo.
 */
export function Titulo() {
  return (
    <header className={estilos.hero}>
      <p className={estilos.kicker}>
        Emisiones de CO₂ · {ANIO_MIN}–{ANIO_MAX}
      </p>
      <h1 className={estilos.titulo}>Huella de Carbono: ¿Quién contamina más?</h1>
      <p className={estilos.subtitulo}>
        Cuánto CO₂ de combustibles fósiles e industria emite cada país, cómo cambió desde 2010 y qué relación tiene
        con su riqueza y su población. Fuente: Our World in Data.
      </p>
    </header>
  )
}
