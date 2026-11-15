"""
Limpieza de datos de CO2 (Our World in Data) para el dashboard.

Entrada:
  data/raw/owid-co2-data.csv        CSV original de OWID (no se edita)
  data/raw/owid-continents.csv      Pais -> continente segun OWID

Salida:
  data/processed/paises.csv     tabla limpia por pais y anio (2010-2023)
  data/processed/agregados.csv  World y continentes por anio (2010-2023)
  public/data/paises.json                 lo que consume React
  public/data/agregados.json

Uso (desde la raiz del repo):
  pip install pandas pycountry
  python scripts/clean.py
"""
from pathlib import Path
import json
import sys

import pandas as pd
import pycountry

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
PROCESSED = RAIZ / "data" / "processed"
PUBLIC = RAIZ / "public" / "data"

ANIO_INI, ANIO_FIN = 2010, 2023
# OWID solo publica PIB hasta 2022: la regla de nulos de PIB se evalua en 2010-2022
ANIO_FIN_PIB = 2022
MAX_ANIOS_SIN_PIB = 3

CONTINENTES = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania"]
CONTINENTES_ES = {
    "Africa": "África",
    "Asia": "Asia",
    "Europe": "Europa",
    "North America": "Norteamérica",
    "South America": "Sudamérica",
    "Oceania": "Oceanía",
}

COLUMNAS = {
    "country": "pais",
    "iso_code": "iso",
    "year": "anio",
    "population": "poblacion",
    "gdp": "pib",
    "co2": "co2",
    "co2_per_capita": "co2_pc",
    "coal_co2": "carbon",
    "oil_co2": "petroleo",
    "gas_co2": "gas",
    "cement_co2": "cemento",
    "flaring_co2": "flaring",
}
NUMERICAS = ["poblacion", "pib", "co2", "co2_pc", "carbon", "petroleo", "gas", "cemento", "flaring"]


def cargar_continentes() -> pd.DataFrame:
    ruta = RAW / "owid-continents.csv"
    if not ruta.exists():
        sys.exit(f"Falta {ruta}. Descargalo primero (ver README).")
    c = pd.read_csv(ruta)
    col_codigo = next(x for x in c.columns if x.lower() == "code")
    # La columna se llama "World region according to OWID" (antes "Continent")
    col_cont = next(x for x in c.columns if "continent" in x.lower() or "region" in x.lower())
    c = c[[col_codigo, col_cont]].dropna().drop_duplicates(col_codigo)
    c.columns = ["iso", "continente_en"]
    return c


def main() -> None:
    df = pd.read_csv(RAW / "owid-co2-data.csv", usecols=list(COLUMNAS))
    df = df.rename(columns=COLUMNAS)

    # 1. Filtrar anios
    df = df[df["anio"].between(ANIO_INI, ANIO_FIN)].copy()

    # 2. Separar paises de agregados: sin iso = agregado (World, Asia, grupos de ingreso...)
    #    Nota: en esta version Kosovo viene sin iso, asi que queda fuera de paises.
    agregados = df[df["iso"].isna()].copy()
    paises = df[df["iso"].notna()].copy()

    # 3. Valores imposibles: negativos -> nulo, poblacion en cero fuera, duplicados fuera
    for col in NUMERICAS:
        paises.loc[paises[col] < 0, col] = pd.NA
    paises = paises[paises["poblacion"].fillna(0) > 0]
    paises = paises.drop_duplicates(["iso", "anio"])

    # 4. PIB per capita
    paises["pib_pc"] = paises["pib"] / paises["poblacion"]

    # 5. Regla de nulos de PIB: mas de 3 anios sin PIB (2010-2022) -> fuera de la dispersion
    rango_pib = paises[paises["anio"] <= ANIO_FIN_PIB]
    sin_pib = rango_pib.groupby("iso")["pib"].apply(lambda s: s.isna().sum())
    fuera = set(sin_pib[sin_pib > MAX_ANIOS_SIN_PIB].index)
    paises["en_dispersion"] = ~paises["iso"].isin(fuera)

    # 6. Codigo ISO alfa-2 para que React traduzca el nombre al espanol (Intl.DisplayNames)
    def a_iso2(iso3: str):
        pais = pycountry.countries.get(alpha_3=iso3)
        return pais.alpha_2 if pais else None

    paises["iso2"] = paises["iso"].map(a_iso2)

    # 7. Continente
    cont = cargar_continentes()
    paises = paises.merge(cont, on="iso", how="left")
    paises["continente"] = paises["continente_en"].map(CONTINENTES_ES)
    sin_cont = paises[paises["continente"].isna()]["pais"].unique()
    paises = paises.drop(columns="continente_en")

    # Agregados: solo World y los 6 continentes
    agregados = agregados[agregados["pais"].isin(["World", *CONTINENTES])].copy()
    agregados["nombre"] = agregados["pais"].map({"World": "Mundo", **CONTINENTES_ES})
    agregados = agregados[["pais", "nombre", "anio", "poblacion", "co2", "co2_pc",
                           "carbon", "petroleo", "gas", "cemento", "flaring"]]

    orden = ["iso", "iso2", "pais", "continente", "anio", "poblacion", "pib", "pib_pc",
             "co2", "co2_pc", "carbon", "petroleo", "gas", "cemento", "flaring", "en_dispersion"]
    paises = paises[orden].sort_values(["iso", "anio"])
    agregados = agregados.sort_values(["pais", "anio"])

    PROCESSED.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    paises.to_csv(PROCESSED / "paises.csv", index=False)
    agregados.to_csv(PROCESSED / "agregados.csv", index=False)

    def a_json(d: pd.DataFrame, ruta: Path) -> None:
        d = d.round({"pib_pc": 0, "co2": 3, "co2_pc": 3, "carbon": 3, "petroleo": 3,
                     "gas": 3, "cemento": 3, "flaring": 3})
        registros = json.loads(d.to_json(orient="records", force_ascii=False))
        ruta.write_text(json.dumps(registros, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    a_json(paises, PUBLIC / "paises.json")
    a_json(agregados, PUBLIC / "agregados.json")

    # Resumen para el documento
    print(f"Paises: {paises['iso'].nunique()} | filas: {len(paises)} | anios {ANIO_INI}-{ANIO_FIN}")
    print(f"Agregados: {sorted(agregados['pais'].unique())}")
    print(f"Fuera de la dispersion (>{MAX_ANIOS_SIN_PIB} anios sin PIB): {len(fuera)} paises")
    print(f"PIB disponible hasta: {ANIO_FIN_PIB} (OWID no publica PIB {ANIO_FIN_PIB + 1}+)")
    print(f"Sin continente asignado ({len(sin_cont)}): {list(sin_cont)}")


if __name__ == "__main__":
    main()
