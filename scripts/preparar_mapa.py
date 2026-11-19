"""
Prepara el mapa mundial para el dashboard.

Entrada:
  data/raw/world-atlas-countries-50m.json    TopoJSON de Natural Earth 1:50m
                                             (paquete npm world-atlas 2.0.2, licencia ISC)
Salida:
  public/data/mundo-50m.json                 el mismo TopoJSON, con el codigo ISO3 de cada pais
                                             en properties.iso para cruzarlo con paises.json

world-atlas identifica cada pais con su codigo ISO numerico (ej. "484" = Mexico);
aqui se traduce a ISO alfa-3 ("MEX"), que es el que usa Our World in Data.
Se quita la Antartida porque no tiene datos y ocupa mucho espacio.
Se usa la escala 1:50m (no 1:110m) para que, al hacer zoom en el mapa de Leaflet,
los bordes de los paises coincidan con el mapa base.

Uso (desde la raiz del repo):
  pip install pycountry
  python scripts/preparar_mapa.py
"""
from pathlib import Path
import json

import pycountry

RAIZ = Path(__file__).resolve().parent.parent
ENTRADA = RAIZ / "data" / "raw" / "world-atlas-countries-50m.json"
SALIDA = RAIZ / "public" / "data" / "mundo-50m.json"

ANTARTIDA = "010"


def main() -> None:
    topo = json.loads(ENTRADA.read_text(encoding="utf-8"))
    geometrias = topo["objects"]["countries"]["geometries"]

    sin_codigo = []
    conservadas = []
    for g in geometrias:
        numerico = g.get("id")
        if numerico == ANTARTIDA:
            continue
        pais = pycountry.countries.get(numeric=numerico) if numerico else None
        props = g.setdefault("properties", {})
        props["iso"] = pais.alpha_3 if pais else None
        if not pais:
            sin_codigo.append(props.get("name"))
        conservadas.append(g)

    topo["objects"]["countries"]["geometries"] = conservadas
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps(topo, separators=(",", ":")), encoding="utf-8")

    print(f"Paises en el mapa: {len(conservadas)}")
    print(f"Sin codigo ISO (se pintan como 'sin dato'): {sin_codigo}")


if __name__ == "__main__":
    main()
