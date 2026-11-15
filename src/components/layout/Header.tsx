import { useMemo } from 'react'
import { useFiltros } from '../../context/filtros.ts'
import { ANIO_MAX, ANIO_MIN, CONTINENTES, type RegistroPais } from '../../types.ts'
import estilos from './Header.module.css'

interface Props {
  paises: RegistroPais[]
}

/** Fila 0 del wireframe (72 px): título, subtítulo y los tres filtros globales. */
export function Header({ paises }: Props) {
  const { anio, continente, pais, setAnio, setContinente, setPais } = useFiltros()

  // Lista de países del desplegable, limitada al continente elegido
  const opcionesPais = useMemo(() => {
    const vistos = new Map<string, string>()
    for (const r of paises) {
      if (continente === 'Todos' || r.continente === continente) vistos.set(r.iso, r.pais)
    }
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1], 'es'))
  }, [paises, continente])

  return (
    <header className={estilos.header}>
      <div>
        <h1 className={estilos.titulo}>Huella de Carbono: ¿Quién contamina más?</h1>
        <p className={estilos.subtitulo}>
          Emisiones de CO₂, PIB y población · {ANIO_MIN}–{ANIO_MAX} · Fuente: Our World in Data
        </p>
      </div>

      <div className={estilos.filtros}>
        <label className={estilos.filtroAnio}>
          Año
          <strong>{anio}</strong>
          <input
            type="range"
            className={estilos.deslizador}
            min={ANIO_MIN}
            max={ANIO_MAX}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
          />
          <span className={estilos.extremos}>
            <span>{ANIO_MIN}</span>
            <span>{ANIO_MAX}</span>
          </span>
        </label>

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
  )
}
