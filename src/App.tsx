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

/**
 * Dashboard "Huella de Carbono". El orden de las tarjetas sigue las filas del wireframe:
 * encabezado · KPIs · mapa + ranking · líneas + dispersión · fuentes + notas.
 */
export default function App() {
  const { paises, agregados, cargando, error } = useDatos()
  const alcance = useAlcance(paises, agregados)

  if (error) return <p className={estilos.estado}>No se pudieron cargar los datos: {error}</p>
  if (cargando) return <p className={estilos.estado}>Cargando datos…</p>

  return (
    <div className={estilos.frame}>
      <p className={estilos.etiqueta}>
        <span className={estilos.etiquetaProyecto}>Proyecto 2</span>
        Dashboard híbrido estratégico-táctico · Visualización de Datos, UCARIBE
      </p>
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
        <NotasMetodologia className={estilos.notas} />
      </main>
    </div>
  )
}
