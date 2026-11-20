"""
Ubica los paises que no tienen forma en el mapa, para dibujarlos como un punto.

El globo usa el TopoJSON 1:110m (ligero para WebGL) y ahi no aparecen los paises
pequenos (Singapur, Malta, islas del Caribe y del Pacifico...). El mapa plano usa 1:50m
y le faltan menos. Este script calcula una coordenada para cada pais de paises.json que
no tenga poligono en el 1:110m:

  1. Si el pais existe en el 1:50m: el centro de su poligono mas grande.
  2. Si tampoco esta ahi (territorios que Natural Earth incluye dentro de otro pais):
     una coordenada de referencia escrita abajo, en COORDENADAS_EXTRA.

Entrada:  public/data/mundo-110m.json, public/data/mundo-50m.json, public/data/paises.json
Salida:   public/data/centros-pequenos.json   [{"iso", "lat", "lng"}]

No toca ningun dato de emisiones: solo dice donde poner el punto.

Uso (desde la raiz del repo):
  python scripts/centros_pequenos.py
"""
from pathlib import Path
import json

RAIZ = Path(__file__).resolve().parent.parent
DATOS = RAIZ / "public" / "data"
SALIDA = DATOS / "centros-pequenos.json"

# Centro aproximado de los territorios que no tienen forma propia en Natural Earth 1:50m
COORDENADAS_EXTRA = {
    "BES": (12.18, -68.25),   # Bonaire, San Eustaquio y Saba (Bonaire)
    "GLP": (16.25, -61.58),   # Guadalupe
    "GUF": (4.00, -53.00),    # Guayana Francesa
    "MTQ": (14.64, -61.02),   # Martinica
    "MYT": (-12.83, 45.14),   # Mayotte
    "REU": (-21.11, 55.53),   # Reunion
    "TUV": (-8.52, 179.20),   # Tuvalu (Funafuti)
}


def leer(nombre: str):
    return json.loads((DATOS / nombre).read_text(encoding="utf-8"))


def isos_con_forma(topo) -> set[str]:
    return {
        g["properties"]["iso"]
        for g in topo["objects"]["countries"]["geometries"]
        if g.get("properties", {}).get("iso")
    }


def decodificar_arcos(topo) -> list[list[tuple[float, float]]]:
    """Arcos del TopoJSON en lon/lat (deshace la cuantizacion delta)."""
    t = topo.get("transform")
    arcos = []
    for arco in topo["arcs"]:
        x = y = 0
        puntos = []
        for dx, dy in arco:
            if t:
                x += dx
                y += dy
                puntos.append((x * t["scale"][0] + t["translate"][0], y * t["scale"][1] + t["translate"][1]))
            else:
                puntos.append((dx, dy))
        arcos.append(puntos)
    return arcos


def anillo(indices: list[int], arcos) -> list[tuple[float, float]]:
    puntos: list[tuple[float, float]] = []
    for i in indices:
        tramo = arcos[i] if i >= 0 else arcos[~i][::-1]
        puntos.extend(tramo if not puntos else tramo[1:])
    return puntos


def centro_anillo(puntos) -> tuple[float, float, float]:
    """Area y centroide plano de un anillo (suficiente para islas y paises pequenos)."""
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(puntos, puntos[1:] + puntos[:1]):
        f = x0 * y1 - x1 * y0
        a += f
        cx += (x0 + x1) * f
        cy += (y0 + y1) * f
    if abs(a) < 1e-12:
        xs, ys = zip(*puntos)
        return 0.0, sum(xs) / len(xs), sum(ys) / len(ys)
    return abs(a) / 2, cx / (3 * a), cy / (3 * a)


def centros_50m(topo) -> dict[str, tuple[float, float]]:
    arcos = decodificar_arcos(topo)
    centros = {}
    for g in topo["objects"]["countries"]["geometries"]:
        iso = g.get("properties", {}).get("iso")
        if not iso or g.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        poligonos = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        # El poligono mas grande (anillo exterior) define el punto
        mejor = max((centro_anillo(anillo(p[0], arcos)) for p in poligonos), key=lambda c: c[0])
        centros[iso] = (mejor[2], mejor[1])  # (lat, lng)
    return centros


def main() -> None:
    paises = leer("paises.json")
    isos = sorted({p["iso"] for p in paises})
    con_forma_110 = isos_con_forma(leer("mundo-110m.json"))
    topo50 = leer("mundo-50m.json")
    centros50 = centros_50m(topo50)

    salida, sin_ubicar = [], []
    for iso in isos:
        if iso in con_forma_110:
            continue
        lat_lng = centros50.get(iso) or COORDENADAS_EXTRA.get(iso)
        if not lat_lng:
            sin_ubicar.append(iso)
            continue
        salida.append({"iso": iso, "lat": round(lat_lng[0], 3), "lng": round(lat_lng[1], 3)})

    SALIDA.write_text(json.dumps(salida, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Paises sin forma en 1:110m ubicados como punto: {len(salida)}")
    print(f"Sin ubicar: {sin_ubicar}")


if __name__ == "__main__":
    main()
