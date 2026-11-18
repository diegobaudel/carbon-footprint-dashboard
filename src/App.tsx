import { useEffect, useState } from 'react'
import { useDatos } from './hooks/useDatos.ts'
import { useAlcance } from './hooks/useAlcance.ts'
import { Header } from './components/layout/Header.tsx'
import { NotasMetodologia } from './components/layout/NotasMetodologia.tsx'
import { KpiPrincipal } from './components/kpis/KpiPrincipal.tsx'
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
  const [modoOscuro, setModoOscuro] = useState(false)
  useEffect(() => {
    document.documentElement.dataset.tema = modoOscuro ? 'oscuro' : 'claro'
  }, [modoOscuro])
  // Estado para controlar la visibilidad del modal de Metodología
  const [mostrarNotas, setMostrarNotas] = useState(false)

  if (error) return <p className={estilos.estado}>No se pudieron cargar los datos: {error}</p>
  if (cargando) return <p className={estilos.estado}>Cargando datos…</p>

  return (
    <div className={estilos.frame}>
      <div className={estilos.barraSuperiorGlobal}>
        <p className={estilos.etiqueta}>
          <span className={estilos.etiquetaProyecto}>Proyecto 2</span>
          Dashboard híbrido estratégico-táctico · Visualización de Datos, UCARIBE
        </p>
        
        {/* Botones de Control Global: Modo Oscuro y Metodología Flotante */}
        <div className={estilos.controlesGlobales}>
          <button 
            onClick={() => setModoOscuro(!modoOscuro)}
            className={estilos.botonTema}
            title="Cambiar modo oscuro/claro"
          >
            {modoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
          </button>
          <button 
            onClick={() => setMostrarNotas(!mostrarNotas)} 
            className={estilos.botonInfo}
            title="Notas y metodología"
          >
            ℹ️ Metodología
          </button>
        </div>
      </div>

      <Header paises={paises} />

      <main className={estilos.dashboard}>
        <KpiPrincipal alcance={alcance} className={estilos.kpiPrincipal} />
        <div className={estilos.kpisSecundarios}>
          <Top5Emisores paises={paises} />
          <VariacionParis alcance={alcance} />
          <MayorReduccion paises={paises} />
        </div>

        <MapaCO2 paises={paises} className={estilos.mapa} />
        <RankingPaises paises={paises} className={estilos.ranking} />

        <LineasContinente agregados={agregados} className={estilos.lineas} />
        <DispersionPib paises={paises} className={estilos.dispersion} />

        <BarrasFuente paises={paises} className={estilos.fuentes} />
        
        {/* Si se activa el botón flotante, muestra el componente de notas en formato modal/panel */}
        {mostrarNotas && (
          <div className={estilos.modalOverlay} onClick={() => setMostrarNotas(false)}>
            <div className={estilos.modalContenido} onClick={(e) => e.stopPropagation()}>
              <button className={estilos.cerrarModal} onClick={() => setMostrarNotas(false)}>✕</button>
              <NotasMetodologia className={estilos.notas} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}