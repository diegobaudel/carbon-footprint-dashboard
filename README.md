# Huella de carbono: ¿quién contamina más?

> Proyecto 2 · Dashboard interactivo en React · Visualización de Datos, Universidad del Caribe

## Equipo

| Integrante | Rol |
|---|---|
| Gabriela Carolyn Montiel Uicab | Líder del equipo |
| Sofía Regina Herrera Uc | Integrante |
| Diego Baudel López Ramírez | Integrante |

**Profesora:** Mtra. Jessica Carmin Mendiola Fuentes

## Descripción

Dashboard para analizar cómo se relacionan el crecimiento económico (PIB), la población y las emisiones de CO₂ de cada país entre 2010 y 2023. Sirve para comparar quién emite más en total contra quién emite más por persona, y para ver qué países han bajado sus emisiones antes y después del Acuerdo de París (2015).

**Objetivo:** identificar qué países y regiones concentran las emisiones de CO₂ y evaluar si el crecimiento económico se está separando de la contaminación entre 2010 y 2023.

**Usuarios:** quienes diseñan política pública y dirigen áreas de sostenibilidad (vista general), analistas ambientales e investigadores (vista de detalle) y ciudadanos interesados.

### Tipo de dashboard: híbrido estratégico-táctico

El dashboard tiene dos niveles en una misma vista:

- **Nivel estratégico (parte superior).** KPIs globales y mapa mundial de CO₂ per cápita, para tener el panorama de largo plazo de un vistazo.
- **Nivel táctico (parte inferior).** Dispersión PIB vs CO₂, series por continente, ranking de países y emisiones por fuente, con filtros por año, continente y país.

Se descartó el tipo operativo porque los datos son anuales y no hay métricas en tiempo real.

### KPIs

- Promedio global de CO₂ per cápita
- Top 5 países emisores
- Variación % de emisiones (2010–2015 vs 2015–2023)
- País con mayor reducción relativa de emisiones

### Visualizaciones

- Mapa mundial de CO₂ per cápita
- Series de tiempo de emisiones por continente
- Dispersión PIB per cápita vs CO₂ per cápita (escala logarítmica)
- Barras apiladas de emisiones por fuente (carbón, petróleo, gas, cemento, flaring)

## Metodología

Desarrollo incremental por fases, guiado por **CRISP-DM** y con seguimiento de tareas en **GitHub Projects**.

| Fase del proyecto | Etapas CRISP-DM |
|---|---|
| Fase 1: Análisis | Comprensión del problema, comprensión de los datos, plan de preparación |
| Fase 2: Diseño y preparación | Preparación de datos, carga a la BD, prototipo del dashboard |
| Fase 3: Desarrollo | Construcción de KPIs y gráficas en React |
| Fase 4: Evaluación y despliegue | Validación con los objetivos, publicación en Vercel |

## Forma de trabajo

> Si usas un agente de IA (Claude, Codex, Cursor…), sus instrucciones están en [`AGENTS.md`](AGENTS.md).

### Equipo y ramas
| Persona | Rol | Rama |
|---|---|---|
| Gabriela Carolyn Montiel Uicab | Líder, aprueba los PR a `main` | `develop/gabriela` |
| Sofía Regina Herrera Uc | Integrante | `develop/sofia` |
| Diego Baudel López Ramírez | Integrante | `develop/bauky` |

- Cada quien trabaja en su `develop/<nombre>`, creada desde `main`.
- Lo de otra persona no se toca sin avisarle.

### Flujo
```
main ──► develop/<nombre> ──PR──► main
              ▲
              └── git merge main  (seguido, para no llegar con conflictos)
```
1. Crear tu rama una vez: `git checkout main && git pull && git checkout -b develop/<nombre> && git push -u origin develop/<nombre>`
2. Trabajar y subir a tu rama.
3. Antes del PR: `git merge main` en tu rama y resolver conflictos ahí.
4. Abrir PR a `main`. Gabriela lo revisa y lo mergea.

### Reglas de git
- `main` siempre debe correr. Solo entra por PR.
- Nada de force push, rebase, amend ni squash sobre commits ya subidos.
- Commits en español, en presente, diciendo qué cambia. Ej.: "Agrega el KPI de CO₂ per cápita con sparkline 2010–2023".
- Sin coautoría de IA en los commits.
- Si un archivo aparece con todas sus líneas cambiadas, es fin de línea (CRLF/LF): no lo subas así.

### Datos
- `data/raw/` no se edita: es el CSV de OWID tal cual.
- Todo cambio a los datos pasa por `scripts/`.
- No se inventan datos. Si falta un valor, se queda nulo y se documenta.

### Checklist
**Antes de empezar:** `git pull` y `git merge main` en tu rama.
**Antes del PR:** `npm run build` y `npm run lint` sin errores · coincide con el wireframe y la paleta de la Fase 2 · `docs/` al día.

## Datos

**Fuente:** [Our World in Data, CO₂ and Greenhouse Gas Emissions](https://github.com/owid/co2-data)
**Archivo:** `owid-co2-data.csv` (una fila por país y año) · **Descargado el:** 13-nov-2026
**Continentes:** `owid-continents.csv` ([World regions according to OWID](https://ourworldindata.org/grapher/continents-according-to-our-world-in-data)), para asignar continente a cada país

| Columna | Descripción | Unidad |
|---|---|---|
| `country` | País o región | — |
| `iso_code` | Código ISO de 3 letras | — |
| `year` | Año | — |
| `population` | Población | habitantes |
| `gdp` | PIB (ajustado por inflación y PPA) | USD internacionales |
| `co2` | Emisiones anuales de CO₂ fósil | millones de toneladas |
| `co2_per_capita` | Emisiones por persona | toneladas |
| `coal_co2`, `oil_co2`, `gas_co2`, `cement_co2`, `flaring_co2` | Emisiones por fuente | millones de toneladas |

### Preprocesamiento

1. Filtrar años 2010–2023.
2. Separar países de agregados: las filas sin `iso_code` (World, Asia, "High-income countries"…) van a otra tabla. De los agregados solo se usan World y los 6 continentes. Kosovo viene sin `iso_code`, así que queda fuera.
3. Calcular PIB per cápita (`gdp / population`).
4. Revisar nulos. Si a un país le faltan más de 3 años de PIB, sale de la dispersión pero sigue en el mapa. OWID solo publica PIB hasta 2022, así que la regla se evalúa en 2010–2022 y la dispersión de 2023 usa el PIB de 2022.
5. Asignar continente a cada país con `owid-continents.csv` (nombres en español).
6. Outliers: los emisores extremos (China, EE. UU., Qatar) no se eliminan, porque son datos reales. Se usa escala logarítmica y rankings separados para total y per cápita. Solo se eliminan valores imposibles (negativos, población en cero, duplicados).
7. Exportar las tablas limpias a `data/processed/` (CSV) y `public/data/` (JSON que carga React). Todo esto lo hace `scripts/clean.py`.

## Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + TypeScript |
| Gráficas | Recharts |
| Mapa | react-simple-maps |
| Datos | JSON local en `public/data/`, cargado con `fetch` |
| Preprocesamiento | Python + pandas |
| Despliegue | Vercel |

```
CSV de OWID → scripts/clean.py (pandas) → public/data/*.json → React (dashboard) → Vercel
```

### Estructura del repo

```
/
├── data/
│   ├── raw/            # CSV originales de OWID (no se editan)
│   └── processed/      # CSV limpios
├── docs/               # Documentos de cada fase
├── public/
│   └── data/           # JSON que consume el dashboard
├── scripts/
│   └── clean.py        # Limpieza: raw → processed + public/data
├── src/
│   ├── components/     # kpis/, charts/, map/, layout/
│   ├── services/       # Carga de datos
│   ├── styles/         # Paleta y estilos globales
│   └── App.tsx
├── AGENTS.md           # Instrucciones para agentes de IA
└── README.md
```

## Cómo correrlo

```bash
git clone https://github.com/diegobaudel/carbon-footprint-dashboard.git
cd carbon-footprint-dashboard
npm install
npm run dev          # http://localhost:5173
```

Regenerar los datos (solo si cambia el CSV o la limpieza):

```bash
pip install pandas
python scripts/clean.py
```

Validar antes de un PR:

```bash
npm run build        # incluye la revisión de tipos de TypeScript
npm run lint
```

## Avance

- [x] Fase 1: Análisis (audiencia, objetivos, tipo de dashboard, plan de preprocesamiento)
- [x] Fase 2: Diseño (KPIs, gráficas, paleta y wireframe en Figma)
- [ ] Fase 3: Desarrollo del dashboard (en curso: datos limpios y proyecto Vite listos)
- [ ] Fase 4: Evaluación y despliegue
