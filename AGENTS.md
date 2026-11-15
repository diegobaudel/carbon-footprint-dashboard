# AGENTS.md

Instrucciones para cualquier agente de IA (Claude, Codex, Cursor, Copilot, etc.) que trabaje en este repo. Léelo completo antes de tocar algo. La forma de trabajo para personas está en el `README.md`, sección "Forma de trabajo".

## Proyecto

Dashboard "Huella de carbono: ¿quién contamina más?". Proyecto 2 de Visualización de Datos (Universidad del Caribe). Analiza emisiones de CO₂, PIB y población por país de 2010 a 2023 con datos de Our World in Data.

- Stack: React + Vite + **TypeScript**, Recharts, react-simple-maps, d3-scale. Limpieza de datos en Python + pandas. Los datos se cargan con `fetch` desde `public/data/*.json` (no hay base de datos).
- Fase vigente: **Fase 3, implementación en React**. Hay que pasar el wireframe de la Fase 2 a código sin cambiar las decisiones de diseño.

## Antes de hacer cualquier cosa

1. Pregunta en qué rama estás (`git branch --show-current`). Trabaja **solo** en la rama `develop/<nombre>` de la persona que te está usando. Si estás en `main` o en la rama de otra persona, detente y avisa.
2. `git pull` y `git log --oneline -8` para ver qué hay.
3. Revisa qué existe hoy en el repo antes de proponer. No asumas que algo falta o que algo existe.

## Ramas

| Rama | Dueño |
|---|---|
| `main` | Equipo. Versión entregable. Solo entra por PR que aprueba Gabriela |
| `develop/gabriela` | Gabriela Carolyn Montiel Uicab (líder) |
| `develop/sofia` | Sofía Regina Herrera Uc |
| `develop/bauky` | Diego Baudel López Ramírez |

- Cada `develop/<nombre>` sale de `main` y regresa a `main` por PR.
- Para traer cambios de `main`: `git merge main` en la rama personal. **No** rebase.
- Nunca hagas commit en `main` ni en la rama de otra persona.

## Reglas que no se rompen

- **No hagas commit ni push si no te lo piden explícitamente.** La persona decide cuándo.
- **Sin coautoría de IA en commits:** nada de `Co-Authored-By: Claude`, `Generated with…` ni similares. El agente no aparece como contribuidor.
- Nada de `push --force`, `rebase`, `commit --amend` ni squash sobre commits ya subidos.
- Commits en español, en presente, diciendo qué cambia. Ej.: `Agrega el KPI de CO₂ per cápita con sparkline 2010–2023`.
- **Cambios quirúrgicos.** Toca solo lo que pide la tarea. Sin refactors, renombres, formateo masivo ni "mejoras" de paso.
- Finales de línea: el equipo usa Windows. Si un archivo sale con todas sus líneas cambiadas, es CRLF/LF. No lo metas así al commit.
- No instales librerías nuevas sin preguntar. Las aprobadas están en el stack de arriba.

## Cómo trabajar una tarea

1. Revisa el estado actual del código y de los datos.
2. Propón un plan con opciones (A, B…): qué archivos tocas y qué queda fuera.
3. **No implementes hasta que la persona dé el OK.**
4. Implementa.
5. Valida: `npm run build` y `npm run lint` sin errores. Si cambia algo visual, compáralo contra el wireframe.
6. Si cambia algo de diseño o de datos, actualiza `docs/`.
7. Resume qué cambiaste y en qué archivos. Que el commit lo pida la persona.

## Datos

- `data/raw/owid-co2-data.csv` es el original de OWID. **No se edita.**
- Toda transformación va en `scripts/` (Python) y sale a `data/processed/` y `public/data/`.
- **No inventes datos** para rellenar huecos ni para "que se vea bien". Si falta un valor se queda nulo y se documenta.
- Las filas sin `iso_code` (World, Asia, grupos de ingreso…) son agregados, no países. Van separadas.
- Outliers reales (China, EE. UU., Qatar) **no se eliminan**. Se manejan con escala logarítmica y rankings separados.

## Diseño (debe coincidir con la Fase 2)

El wireframe aprobado está en Figma Make: "Dashboard de Huella de Carbono", versión 3. Calificación de la Fase 3: 25 pts por correspondencia wireframe ↔ dashboard y 15 pts por paleta. **No cambies layout, colores ni tipos de gráfica sin que el equipo lo apruebe.**

### Paleta (v3, naranja-café)
| Uso | Color |
|---|---|
| Estructura, títulos, texto principal | Azul marino `#1B2A4A` |
| Emisiones: acento principal | Naranja quemado `#C65D21` |
| Mejora o reducción | Azul petróleo `#0F766E` |
| Texto secundario, ejes, bordes | `#6B7280`, `#E5E7EB` |
| Escala del mapa (menos → más) | `#F9E0C7` → `#F2B880` → `#C65D21` → `#8B4513` → `#4A2C1A` |
| Sin dato | `#D1D5DB` |

Sin rojo ni verde (por accesibilidad). Los colores van como variables CSS en `src/styles/`; no escribas hex sueltos en los componentes.

### Tipografía y layout
- Inter. Título 28 px bold, títulos de tarjeta 16 px semibold, KPI principal 56 px, KPIs secundarios 28 px.
- Cuadrícula de 12 columnas, márgenes de 32 px, gutter de 24 px. Fondo `#F7F7F5`, tarjetas blancas con radio de 12 px.
- Filas: encabezado 72 px · KPIs 200 · mapa + ranking 380 · líneas + dispersión 300 · fuentes + notas 240.

### KPIs
1. **Principal:** CO₂ per cápita promedio mundial (ponderado por población), con delta vs 2010 y sparkline.
2. Top 5 emisores (Mt CO₂).
3. Variación % de emisiones 2010–2015 vs 2015–2023 (antes y después de París).
4. País con mayor reducción relativa (países con más de 10 Mt en 2010).

### Visualizaciones
- Mapa coroplético de CO₂ per cápita (react-simple-maps).
- Ranking de países en barras horizontales, con switch Total / Per cápita.
- Líneas de emisiones por continente, con marca en 2015.
- Dispersión de PIB per cápita vs CO₂ per cápita (log-log, tamaño = población).
- Barras apiladas por fuente: carbón, petróleo, gas, cemento, flaring.

## Estructura

```
data/raw/            CSV original de OWID (no se edita)
data/processed/      CSV limpio
scripts/             limpieza en Python
public/data/         JSON que consume el dashboard
src/components/      kpis/, charts/, map/, layout/
src/services/        carga de datos
src/styles/          paleta y estilos globales
docs/                documentación de cada fase
```
