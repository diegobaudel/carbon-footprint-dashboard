import { useEffect, useRef, useState } from 'react'
import { useDatos } from './hooks/useDatos.ts'
import { useAlcance } from './hooks/useAlcance.ts'
import { useRevelarAlScroll } from './hooks/useMovimiento.ts'
import { Header, Titulo } from './components/layout/Header.tsx'
import { NotasMetodologia } from './components/layout/NotasMetodologia.tsx'
import { Seccion } from './components/layout/Seccion.tsx'
import { IconoInfo, IconoLuna, IconoSol } from './components/layout/Iconos.tsx'
import { BotonDescargaDatos } from './components/layout/BotonDescargaDatos.tsx'
import { KpiPrincipal } from './components/kpis/KpiPrincipal.tsx'
import { FraseResumen } from './components/kpis/FraseResumen.tsx'
import { Top5Emisores } from './components/kpis/Top5Emisores.tsx'
import { VariacionParis } from './components/kpis/VariacionParis.tsx'
import { MayorReduccion } from './components/kpis/MayorReduccion.tsx'
import { MapaCO2 } from './components/map/MapaCO2.tsx'
import { RankingPaises } from './components/charts/RankingPaises.tsx'
import { LineasContinente } from './components/charts/LineasContinente.tsx'
import { DispersionPib } from './components/charts/DispersionPib.tsx'
import { BarrasFuente } from './components/charts/BarrasFuente.tsx'
import estilos from './App.module.css'

export default function App() {
  const { paises, agregados, cargando, error } = useDatos()
  const alcance = useAlcance(paises, agregados)

  // Modo oscuro: se marca en <html data-tema="oscuro"> para que las variables de
  // palette.css cambien en toda la pantalla, no solo dentro del frame de 1440 px.
  // El dashboard abre en modo oscuro; el claro queda como opción
  const [modoOscuro, setModoOscuro] = useState(true)
  useEffect(() => {
    document.documentElement.dataset.tema = modoOscuro ? 'oscuro' : 'claro'
  }, [modoOscuro])
  // Estado para controlar la visibilidad del modal de Metodología
  const [mostrarNotas, setMostrarNotas] = useState(false)
  // Esc cierra el modal de Metodología
  useEffect(() => {
    if (!mostrarNotas) return
    const alTeclear = (e: KeyboardEvent) => e.key === 'Escape' && setMostrarNotas(false)
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [mostrarNotas])
  // Las tarjetas aparecen conforme se hace scroll (se apaga con "reducir movimiento")
  const refDashboard = useRef<HTMLElement>(null)
  useRevelarAlScroll(refDashboard, !cargando && !error)

  if (error) return <p className={estilos.estado}>No se pudieron cargar los datos: {error}</p>
  if (cargando) return <p className={estilos.estado}>Cargando datos…</p>

  return (
    <div className={estilos.frame}>
      {/* Barra superior: etiqueta del proyecto y botones globales */}
      <div className={estilos.barraSuperiorGlobal}>
        <p className={estilos.etiqueta}>
          <span className={estilos.etiquetaProyecto}>Proyecto 2</span>
          Dashboard híbrido estratégico-táctico · Visualización de Datos, UCARIBE
        </p>
      
        {/* Botones de Control Global: Modo Oscuro y Metodología Flotante */}
        <div className={estilos.controlesGlobales}>
          <BotonDescargaDatos paises={paises} className={estilos.botonDescarga} />
          <button
            type="button"
            onClick={() => setModoOscuro(!modoOscuro)}
            className={estilos.botonTema}
            aria-pressed={modoOscuro}
            title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {modoOscuro ? <IconoSol /> : <IconoLuna />}
            {modoOscuro ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            type="button"
            onClick={() => setMostrarNotas(!mostrarNotas)}
            className={estilos.botonInfo}
            title="Fuente de los datos, definiciones y cómo se calculan los indicadores"
          >
            <IconoInfo />
            Metodología
          </button>
        </div>
      </div>

      {/* Título grande; debajo, la barra de filtros que se queda fija al hacer scroll */}
      <Titulo />
      <div className={estilos.cabeceraFija}>
        <Header paises={paises} />
      </div>

      <main ref={refDashboard} className={estilos.dashboard}>
        <Seccion numero="01" titulo="Panorama" texto="Cuánto CO₂ emite el mundo y hacia dónde va" />
        <FraseResumen paises={paises} agregados={agregados} className={estilos.resumen} />
        <KpiPrincipal alcance={alcance} className={estilos.kpiPrincipal} />
        <div className={estilos.kpisSecundarios} data-grupo>
          <Top5Emisores paises={paises} />
          <VariacionParis alcance={alcance} />
          <MayorReduccion paises={paises} />
        </div>

        <Seccion numero="02" titulo="¿Dónde se emite?" texto="Emisiones por persona en el mapa y los países que más emiten" />
        <MapaCO2 paises={paises} className={estilos.mapa} />
        <RankingPaises paises={paises} className={estilos.ranking} />

        <Seccion numero="03" titulo="¿Cómo cambió y por qué?" texto="Tendencia por continente y su relación con la riqueza" />
        <LineasContinente agregados={agregados} className={estilos.lineas} />
        <DispersionPib paises={paises} className={estilos.dispersion} />

        <Seccion numero="04" titulo="¿De dónde vienen las emisiones?" texto="Composición por fuente en los mayores emisores" />
        <BarrasFuente paises={paises} className={estilos.fuentes} />
        
        {/* Si se activa el botón flotante, muestra el componente de notas en formato modal/panel */}
        {mostrarNotas && (
          <div className={estilos.modalOverlay} onClick={() => setMostrarNotas(false)}>
            <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
              <button className={estilos.cerrarModal} onClick={() => setMostrarNotas(false)} aria-label="Cerrar">✕</button>
              <NotasMetodologia className={estilos.notas} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}