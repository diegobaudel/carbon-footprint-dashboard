# Huella de carbono: ¿quién contamina más?

> Proyecto 2 · Dashboard interactivo en React · Visualización de Datos — Universidad del Caribe

## Equipo

| Integrante | Matrícula | Rol |
|---|---|---|
| Gabriela Carolyn Montiel Uicab | 230300807 | Lider |
| Sofía Regina Herrera Uc | 230300937 | ' ' |
| Diego Baudel López Ramírez | 230300758 | ' ' |

**Profesora:** Mtra. Jessica Carmin Mendiola Fuentes

## Descripción

Dashboard para analizar cómo se relacionan el crecimiento económico (PIB), la población y las emisiones de CO₂ de cada país entre 2010 y 2023. La idea es poder comparar quién emite más en total contra quién emite más por persona, y ver qué países sí han bajado sus emisiones.

**Usuarios objetivo:** analistas ambientales, gente que diseña políticas públicas, investigadores y ciudadanos interesados en el tema.

**Tipo de dashboard:** táctico-estratégico. Trabaja con datos anuales y tendencias de mediano y largo plazo, no con datos en tiempo real.

### KPIs

- Promedio global de CO₂ per cápita
- Top 5 países emisores
- Variación % de emisiones (2010 → 2023)
- País con mayor reducción relativa de emisiones

### Visualizaciones

- Mapa mundial de CO₂ per cápita
- Series de tiempo de emisiones por continente
- Dispersión PIB per cápita vs CO₂ per cápita
- Barras apiladas de emisiones por fuente (carbón, petróleo, gas, cemento, flaring)

## Datos

**Fuente:** [Our World in Data — CO₂ and Greenhouse Gas Emissions](https://github.com/owid/co2-data)
**Archivo:** `owid-co2-data.csv` (una fila por país y año) · **Descargado el:** `[fecha]`

Variables que usamos:

| Columna | Descripción | Unidad |
|---|---|---|
| `country` | País o región | — |
| `iso_code` | Código ISO de 3 letras | — |
| `year` | Año | — |
| `population` | Población | habitantes |
| `gdp` | PIB (ajustado por inflación y PPA) | USD internacionales |
| `co2` | Emisiones anuales de CO₂ | millones de toneladas |
| `co2_per_capita` | Emisiones por persona | toneladas |
| `coal_co2`, `oil_co2`, `gas_co2`, `cement_co2`, `flaring_co2` | Emisiones por fuente | millones de toneladas |

### Preprocesamiento

1. Filtrar años 2010–2023.
2. Separar países de agregados: las filas sin `iso_code` (World, Asia, "High-income countries", etc.) no son países y se guardan aparte.
3. Calcular PIB per cápita (`gdp / population`).
4. Revisar nulos, sobre todo en `gdp` en los años más recientes.
5. Asignar continente a cada país.
6. Tratar outliers: comparar emisores totales (China, EE. UU.) contra emisores per cápita (Qatar, EAU) con escala logarítmica en la dispersión.
7. Cargar la tabla limpia a la base de datos.

## Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite |
| Gráficas | `[Recharts / Plotly.js]` |
| Mapa | `[react-simple-maps / Plotly choropleth]` |
| Base de datos | `[PostgreSQL (Supabase)]` |
| Preprocesamiento | Python + pandas |
| Despliegue | `[Vercel]` |

```
CSV de OWID → script Python (limpieza) → Base de datos → API → React (dashboard)
```

### Estructura del repo

```
/
├── data/
│   ├── raw/            # CSV original de OWID
│   └── processed/      # CSV limpio
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

## Avance por fases

- [x] Fase 1 — Análisis (audiencia, tipo de dashboard, plan de preprocesamiento)
- [ ] Fase 2 — `[por definir]`
- [ ] Fase 3 — `[por definir]`
