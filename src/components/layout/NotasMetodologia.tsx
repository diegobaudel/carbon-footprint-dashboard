import { Tarjeta } from './Tarjeta.tsx'
import estilos from './NotasMetodologia.module.css'

/**
 * Metodología completa (se abre en el modal del botón "Metodología"): de dónde salen
 * los datos, qué mide cada indicador, cómo se limpiaron y qué limitaciones tienen.
 */
export function NotasMetodologia({ className }: { className?: string }) {
  return (
    <Tarjeta titulo="Metodología y notas" subtitulo="Cómo se construyó este dashboard" className={className}>
      <div className={estilos.contenido}>
        <nav className={estilos.indice} aria-label="Secciones">
          <a href="#met-fuente">Fuente</a>
          <a href="#met-mide">Qué mide</a>
          <a href="#met-kpis">Indicadores</a>
          <a href="#met-graficas">Gráficas</a>
          <a href="#met-limpieza">Limpieza</a>
          <a href="#met-paises">Países</a>
          <a href="#met-limites">Limitaciones</a>
          <a href="#met-uso">Cómo usarlo</a>
        </nav>

        <section id="met-fuente">
          <h3>1. Fuente de los datos</h3>
          <p>
            <strong>Our World in Data (OWID)</strong>, conjunto <em>CO₂ and Greenhouse Gas Emissions</em>{' '}
            (<a href="https://github.com/owid/co2-data" target="_blank" rel="noreferrer">github.com/owid/co2-data</a>),
            con licencia CC BY 4.0. OWID reúne fuentes reconocidas:
          </p>
          <ul>
            <li>
              <strong>Emisiones de CO₂:</strong> Global Carbon Project (Global Carbon Budget).
            </li>
            <li>
              <strong>Población:</strong> estimaciones de Naciones Unidas que integra OWID.
            </li>
            <li>
              <strong>PIB:</strong> Maddison Project Database, en dólares internacionales a precios constantes
              (paridad de poder adquisitivo). OWID lo publica solo hasta <strong>2022</strong>.
            </li>
            <li>
              <strong>Continente de cada país:</strong> clasificación de regiones de OWID (archivo{' '}
              <code>owid-continents.csv</code>).
            </li>
            <li>
              <strong>Mapas:</strong> Natural Earth (paquete world-atlas) a escala 1:50m para el mapa plano y 1:110m
              para el globo. Imagen satelital: NASA GIBS (Blue Marble y luces nocturnas VIIRS). Calles y ciudades al
              acercarse: OpenStreetMap.
            </li>
          </ul>
        </section>

        <section id="met-mide">
          <h3>2. Qué se mide</h3>
          <ul>
            <li>
              Solo <strong>CO₂ de combustibles fósiles e industria</strong>: carbón, petróleo, gas, cemento y quema en
              antorcha (<em>flaring</em>). No incluye cambio de uso de suelo ni otros gases de efecto invernadero
              (metano, óxido nitroso).
            </li>
            <li>
              Son emisiones <strong>territoriales</strong>: se cuentan donde se producen, no donde se consume lo que
              se fabricó.
            </li>
            <li>
              Unidades: <strong>Mt</strong> = millones de toneladas de CO₂ (total del país);{' '}
              <strong>t/hab</strong> = toneladas por persona al año.
            </li>
            <li>Periodo: datos anuales de <strong>2010 a 2023</strong>.</li>
          </ul>
        </section>

        <section id="met-kpis">
          <h3>3. Indicadores (KPIs)</h3>
          <dl>
            <dt>CO₂ per cápita</dt>
            <dd>
              Del año elegido. Para el mundo y los continentes es el <strong>promedio ponderado por población</strong>{' '}
              (CO₂ total ÷ población total, como lo publica OWID), no el promedio simple de los países. Con un país
              elegido muestra el de ese país. El delta compara contra 2010.
            </dd>
            <dt>Top 5 emisores</dt>
            <dd>Los cinco países con más CO₂ total (Mt) en el año y continente filtrados.</dd>
            <dt>Variación % de emisiones</dt>
            <dd>
              Cambio del CO₂ total antes y después del <strong>Acuerdo de París</strong> (firmado en 2015): de 2010 a
              2015 y de 2015 al año elegido.
            </dd>
            <dt>Mayor reducción relativa</dt>
            <dd>
              País con la mayor baja porcentual de CO₂ total entre 2010 y el año elegido, solo entre los que emitían{' '}
              <strong>más de 10 Mt en 2010</strong>, para que no ganen países muy pequeños con cambios grandes en
              términos relativos.
            </dd>
            <dt>Frase “En resumen”</dt>
            <dd>
              Se arma sola con los mismos datos: participación en el total mundial, comparación con el promedio
              mundial por persona, lugar en el ranking y cambio desde 2010.
            </dd>
          </dl>
        </section>

        <section id="met-graficas">
          <h3>4. Cómo leer cada gráfica</h3>
          <dl>
            <dt>Mapa / globo</dt>
            <dd>
              Color según CO₂ por persona en cinco rangos: menos de 1, 1–3, 3–6, 6–10 y 10 o más t/hab. En el globo,
              la altura de cada país también es su CO₂ por persona. Gris = sin dato.
            </dd>
            <dt>Ranking de países</dt>
            <dd>
              Los 10 mayores emisores. En “Per cápita” solo entran países con más de 1 millón de habitantes, para que
              no lo dominen islas con pocos miles de personas.
            </dd>
            <dt>Emisiones por continente</dt>
            <dd>
              CO₂ total por continente, 2010–2023. La línea punteada marca 2015 (Acuerdo de París) y la línea naranja,
              el año elegido.
            </dd>
            <dt>PIB per cápita vs CO₂ per cápita</dt>
            <dd>
              Ambos ejes en <strong>escala logarítmica</strong>: cada marca multiplica el valor, así caben a la vez
              países que emiten 0.1 t y 30 t por persona. El tamaño del punto es la población. Después de 2022 se usa
              el PIB de 2022.
            </dd>
            <dt>Emisiones por fuente</dt>
            <dd>
              Barras apiladas con el CO₂ de carbón, petróleo, gas, cemento y flaring de los 5 mayores emisores; si
              eliges un país fuera del top 5, ocupa el quinto lugar.
            </dd>
          </dl>
        </section>

        <section id="met-limpieza">
          <h3>5. Limpieza de datos</h3>
          <ul>
            <li>
              El CSV original de OWID no se modifica: todo pasa por scripts en Python (<code>scripts/clean.py</code>,{' '}
              <code>preparar_mapa.py</code>, <code>centros_pequenos.py</code>).
            </li>
            <li>Se separan países (con código ISO) de agregados (Mundo, continentes, grupos de ingreso).</li>
            <li>Valores negativos imposibles → nulos; filas con población cero y duplicados → fuera.</li>
            <li>
              Países con <strong>más de 3 años sin PIB</strong> (2010–2022) no aparecen en la dispersión, pero sí en
              el resto del dashboard.
            </li>
            <li>
              <strong>No se inventan datos:</strong> si falta un valor se queda vacío. Los valores atípicos reales
              (China, EE. UU., Qatar) no se eliminan; se manejan con escala logarítmica y rankings.
            </li>
          </ul>
        </section>

        <section id="met-paises">
          <h3>6. Países y territorios</h3>
          <ul>
            <li>
              <strong>222 países y territorios con datos.</strong> Kosovo viene en OWID sin código de país; se le
              asignó <code>XKX</code> (el que usan la UE y el Banco Mundial) y conserva sus datos originales.
            </li>
            <li>
              <strong>Territorios sin datos en OWID</strong> (Puerto Rico, Guam, Sahara Occidental, Malvinas, Gibraltar,
              entre otros) se pueden buscar y elegir; aparecen como “sin datos” y en gris.
            </li>
            <li>
              Los países muy pequeños que no tienen forma en el mapa (Singapur, Malta, islas del Caribe y del Pacífico)
              se dibujan como un punto en su ubicación.
            </li>
            <li>
              Nombres en español generados con el estándar del navegador (<code>Intl.DisplayNames</code>) a partir del
              código ISO.
            </li>
          </ul>
        </section>

        <section id="met-limites">
          <h3>7. Limitaciones</h3>
          <ul>
            <li>
              Las emisiones territoriales no reflejan el CO₂ “importado” en productos: un país que fabrica para otros
              aparece con más emisiones.
            </li>
            <li>
              La caída de 2020 se debe a la pandemia de COVID-19, no necesariamente a políticas climáticas.
            </li>
            <li>
              OWID revisa sus series cada año; las cifras pueden cambiar ligeramente según la versión descargada.
            </li>
            <li>El PIB más reciente es de 2022, así que la dispersión no muestra 2023.</li>
          </ul>
        </section>

        <section id="met-uso">
          <h3>8. Cómo usarlo</h3>
          <ul>
            <li>
              <strong>Filtros:</strong> año (deslizador o ‹ ›), continente y país (escribe para buscar, sin importar
              acentos). Todo el dashboard responde a ellos.
            </li>
            <li>
              <strong>▶ Ver evolución:</strong> vuelve a la vista global y recorre 2010→2023; el globo cambia de color y
              de altura año con año.
            </li>
            <li>
              <strong>Clic en un país</strong> en el globo, el mapa, el ranking, el Top 5, la dispersión o las barras
              para elegirlo; otro clic lo quita.
            </li>
            <li>
              <strong>Descargas:</strong> “Descargar datos” baja un CSV con lo que estás viendo; cada gráfica tiene sus
              botones PNG (imagen) y CSV (datos).
            </li>
          </ul>
        </section>
      </div>
    </Tarjeta>
  )
}
