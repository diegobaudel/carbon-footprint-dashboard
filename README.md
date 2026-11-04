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

## Datos

**Fuente:** [Our World in Data, CO₂ and Greenhouse Gas Emissions](https://github.com/owid/co2-data)
**Archivo:** `owid-co2-data.csv` (una fila por país y año) · **Descargado el:** `[fecha]`

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
2. Separar países de agregados: las filas sin `iso_code` (World, Asia, "High-income countries"…) van a otra tabla.
3. Calcular PIB per cápita (`gdp / population`).
4. Revisar nulos. Si a un país le faltan más de 3 años de PIB, sale de la dispersión pero sigue en el mapa.
5. Asignar continente a cada país.
6. Outliers: los emisores extremos (China, EE. UU., Qatar) no se eliminan, porque son datos reales. Se usa escala logarítmica y rankings separados para total y per cápita. Solo se eliminan valores imposibles (negativos, población en cero, duplicados).
7. Cargar las tablas limpias a PostgreSQL.

## Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Gráficas | Recharts |
| Mapa | react-simple-maps |
| Base de datos | PostgreSQL (Supabase) |
| Preprocesamiento | Python + pandas |
| Despliegue | Vercel |

```
CSV de OWID → script Python (limpieza) → PostgreSQL (Supabase) → React (dashboard) → Vercel
```

### Estructura del repo

```
/
├── data/
│   ├── raw/            # CSV original de OWID
│   └── processed/      # CSV limpio
├── docs/               # Documento de justificación (PDF)
├── scripts/            # Limpieza y carga a la BD
├── src/
│   ├── components/     # KPIs, mapa, gráficas
│   ├── services/       # Consultas a la BD
│   └── App.jsx
└── README.md
```

## Cómo correrlo

> Se completa en las siguientes fases.

```bash
git clone https://github.com/[usuario]/[repo].git
cd [repo]
npm install
npm run dev
```

## Avance

- [x] Fase 1: Análisis (audiencia, objetivos, tipo de dashboard, plan de preprocesamiento)
- [ ] Fase 2: Diseño y preparación de datos
- [ ] Fase 3: Desarrollo del dashboard
- [ ] Fase 4: Evaluación y despliegue
