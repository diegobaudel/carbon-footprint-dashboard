"""
Prepara los mapas mundiales del dashboard.

Entrada:
  data/raw/world-atlas-countries-50m.json    TopoJSON de Natural Earth 1:50m
  data/raw/world-atlas-countries-110m.json   TopoJSON de Natural Earth 1:110m
                                             (paquete npm world-atlas 2.0.2, licencia ISC)
  public/data/paises.json                    paises con datos (lo genera scripts/clean.py)
  data/raw/owid-continents.csv               pais -> continente segun OWID
Salida:
  public/data/mundo-50m.json                 mapa plano (Leaflet), con ISO3 en properties.iso
  public/data/mundo-110m.json                globo 3D (mas ligero para WebGL), igual
  public/data/territorios.json               territorios que salen en el mapa pero no tienen
                                             datos en OWID (Puerto Rico, Guam, Sahara
                                             Occidental...). Se listan en el buscador como
                                             "sin datos" para que tambien se puedan elegir.

world-atlas identifica cada pais con su codigo ISO numerico (ej. "484" = Mexico);
aqui se traduce a ISO alfa-3 ("MEX"), que es el que usa Our World in Data.
Kosovo no tiene codigo numerico: se identifica por nombre y se le pone XKX
(el mismo codigo que le pone scripts/clean.py).
Se quita la Antartida porque no tiene datos y ocupa mucho espacio.
El 1:50m es para que, al hacer zoom en el mapa de Leaflet, los bordes coincidan con el
mapa base; el 1:110m es para el globo, donde importa mas que sea ligero.

Uso (desde la raiz del repo, despues de scripts/clean.py):
  pip install pycountry
  python scripts/preparar_mapa.py
"""
from pathlib import Path
import csv
import json

import pycountry

RAIZ = Path(__file__).resolve().parent.parent
RAW = RAIZ / "data" / "raw"
PUBLIC = RAIZ / "public" / "data"
ESCALAS = {"50m": "world-atlas-countries-50m.json", "110m": "world-atlas-countries-110m.json"}

ANTARTIDA = "010"
# Paises sin codigo numerico en world-atlas que si tienen codigo en el dashboard
POR_NOMBRE = {"Kosovo": ("XKX", "XK")}

# Territorios habitados con codigo ISO que no salen como forma en Natural Earth ni tienen
# datos en OWID. Se agregan a la lista para que el buscador tenga todos los paises y
# territorios del mundo (se dibujan como punto; ver scripts/centros_pequenos.py).
# Continente: el de owid-continents.csv; Svalbard no viene ahi y se pone a mano.
SIN_FORMA = ["CCK", "CXR", "GIB", "SJM", "TKL"]
CONTINENTE_MANUAL = {"SJM": "Europe"}

CONTINENTES_ES = {
    "Africa": "África",
    "Asia": "Asia",
    "Europe": "Europa",
    "North America": "Norteamérica",
    "South America": "Sudamérica",
    "Oceania": "Oceanía",
}


def preparar(escala: str) -> list[dict]:
    topo = json.loads((RAW / ESCALAS[escala]).read_text(encoding="utf-8"))
    geometrias = topo["objects"]["countries"]["geometries"]

    sin_codigo = []
    conservadas = []
    for g in geometrias:
        numerico = g.get("id")
        if numerico == ANTARTIDA:
            continue
        props = g.setdefault("properties", {})
        pais = pycountry.countries.get(numeric=numerico) if numerico else None
        if pais:
            props["iso"], props["iso2"] = pais.alpha_3, pais.alpha_2
        elif props.get("name") in POR_NOMBRE:
            props["iso"], props["iso2"] = POR_NOMBRE[props["name"]]
        else:
            props["iso"], props["iso2"] = None, None
            sin_codigo.append(props.get("name"))
        conservadas.append(g)

    topo["objects"]["countries"]["geometries"] = conservadas
    (PUBLIC / f"mundo-{escala}.json").write_text(json.dumps(topo, separators=(",", ":")), encoding="utf-8")
    print(f"[{escala}] paises en el mapa: {len(conservadas)} | sin codigo ISO: {sin_codigo}")
    return conservadas


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    geometrias = preparar("50m")
    preparar("110m")

    # Territorios del mapa sin datos en OWID: se listan para poder elegirlos (sin inventar datos)
    con_datos = {p["iso"] for p in json.loads((PUBLIC / "paises.json").read_text(encoding="utf-8"))}
    with open(RAW / "owid-continents.csv", encoding="utf-8") as f:
        continentes = {r["Code"]: r["World region according to OWID"] for r in csv.DictReader(f)}
    continentes.update(CONTINENTE_MANUAL)
    candidatos = [(g["properties"].get("iso"), g["properties"].get("name")) for g in geometrias]
    candidatos += [(iso, pycountry.countries.get(alpha_3=iso).name) for iso in SIN_FORMA]
    territorios, sin_continente, vistos = [], [], set()
    for iso, nombre in candidatos:
        if not iso or iso in con_datos or iso in vistos:
            continue
        vistos.add(iso)
        continente = CONTINENTES_ES.get(continentes.get(iso, ""))
        if not continente:  # deshabitados del oceano austral (sin continente en OWID)
            sin_continente.append(nombre)
            continue
        pais = pycountry.countries.get(alpha_3=iso)
        territorios.append({"iso": iso, "iso2": pais.alpha_2 if pais else None,
                            "pais": pais.name if pais else nombre, "continente": continente})
    territorios.sort(key=lambda t: t["iso"])
    (PUBLIC / "territorios.json").write_text(json.dumps(territorios, ensure_ascii=False, separators=(",", ":")),
                                            encoding="utf-8")
    print(f"Territorios del mapa sin datos en OWID: {len(territorios)} {[t['iso'] for t in territorios]}")
    print(f"Fuera por no tener continente (deshabitados): {sin_continente}")


if __name__ == "__main__":
    main()
