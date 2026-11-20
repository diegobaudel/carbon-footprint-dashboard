import { useEffect, useId, useMemo, useRef, useState } from 'react'
import estilos from './BuscadorPais.module.css'

interface Props {
  /** [iso, nombre] ordenados por nombre. */
  opciones: [string, string][]
  /** iso elegido o 'Todos'. */
  valor: string
  onCambiar: (iso: string) => void
  /** Clase del campo (la misma que los demás filtros del encabezado). */
  claseCampo?: string
}

/** Quita acentos y mayúsculas: "mexico" encuentra "México", "peru" encuentra "Perú". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Filtro de país con buscador: al escribir se filtra la lista (sin importar acentos);
 * también funciona como lista desplegable al hacer clic. Teclado: ↑ ↓ para moverse,
 * Enter para elegir, Esc para cerrar.
 */
export function BuscadorPais({ opciones, valor, onCambiar, claseCampo }: Props) {
  const idLista = useId()
  const raiz = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)

  const nombreElegido = valor === 'Todos' ? 'Todos' : (opciones.find(([iso]) => iso === valor)?.[1] ?? valor)

  // "Todos" siempre va primero; luego los países que contienen lo escrito
  // (primero los que empiezan con ese texto)
  const filtradas = useMemo(() => {
    const busqueda = normalizar(texto.trim())
    const todos: [string, string] = ['Todos', 'Todos los países']
    if (!busqueda) return [todos, ...opciones]
    const empiezan: [string, string][] = []
    const contienen: [string, string][] = []
    for (const op of opciones) {
      const n = normalizar(op[1])
      if (n.startsWith(busqueda)) empiezan.push(op)
      else if (n.includes(busqueda)) contienen.push(op)
    }
    return [todos, ...empiezan, ...contienen]
  }, [opciones, texto])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return
    const alClicFuera = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alClicFuera)
    return () => document.removeEventListener('pointerdown', alClicFuera)
  }, [abierto])

  // La opción activa siempre a la vista al moverse con el teclado
  useEffect(() => {
    if (abierto) lista.current?.children[activo]?.scrollIntoView({ block: 'nearest' })
  }, [activo, abierto])

  function abrir() {
    setTexto('')
    // Al abrir, la opción marcada es el país elegido (si está en la lista)
    const i = valor === 'Todos' ? 0 : opciones.findIndex(([iso]) => iso === valor) + 1
    setActivo(Math.max(0, i))
    setAbierto(true)
  }

  function elegir(iso: string) {
    onCambiar(iso)
    setAbierto(false)
    setTexto('')
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      abrir()
      return
    }
    if (!abierto) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActivo((i) => Math.min(filtradas.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const op = filtradas[activo]
      if (op) elegir(op[0])
    } else if (e.key === 'Escape') {
      setAbierto(false)
      setTexto('')
    }
  }

  return (
    <div ref={raiz} className={estilos.buscador}>
      <input
        type="text"
        role="combobox"
        aria-label="País"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={abierto && filtradas[activo] ? `${idLista}-${filtradas[activo][0]}` : undefined}
        className={`${claseCampo ?? ''} ${estilos.campo}`}
        value={abierto ? texto : nombreElegido}
        placeholder={abierto ? `Buscar país… (${nombreElegido})` : undefined}
        onFocus={abrir}
        onClick={() => !abierto && abrir()}
        onChange={(e) => {
          setTexto(e.target.value)
          setActivo(e.target.value.trim() ? 1 : 0)
          setAbierto(true)
        }}
        onKeyDown={alTeclear}
        onBlur={() => {
          setAbierto(false)
          setTexto('')
        }}
        autoComplete="off"
        spellCheck={false}
      />
      <span className={estilos.flecha} aria-hidden="true">
        ▾
      </span>
      {abierto && (
        <ul ref={lista} id={idLista} role="listbox" className={estilos.lista}>
          {filtradas.map(([iso, nombre], i) => (
            <li
              key={iso}
              id={`${idLista}-${iso}`}
              role="option"
              aria-selected={iso === valor}
              className={`${estilos.opcion} ${i === activo ? estilos.activa : ''} ${iso === valor ? estilos.elegida : ''}`}
              // pointerdown para elegir antes de que el campo pierda el foco
              onPointerDown={(e) => {
                e.preventDefault()
                elegir(iso)
              }}
              onPointerEnter={() => setActivo(i)}
            >
              {nombre}
            </li>
          ))}
          {filtradas.length === 1 && <li className={estilos.vacio}>Ningún país coincide con “{texto}”</li>}
        </ul>
      )}
    </div>
  )
}
