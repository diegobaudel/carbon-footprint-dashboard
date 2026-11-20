/** Íconos de línea (SVG) para los botones; heredan el color del texto. */
interface Props {
  tamano?: number
}

const base = (tamano: number) => ({
  width: tamano,
  height: tamano,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export function IconoSol({ tamano = 16 }: Props) {
  return (
    <svg {...base(tamano)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function IconoLuna({ tamano = 16 }: Props) {
  return (
    <svg {...base(tamano)}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

export function IconoInfo({ tamano = 16 }: Props) {
  return (
    <svg {...base(tamano)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  )
}

export function IconoPlay({ tamano = 16 }: Props) {
  return (
    <svg {...base(tamano)} fill="currentColor">
      <path d="M8 5.5v13l10-6.5-10-6.5Z" />
    </svg>
  )
}

export function IconoPausa({ tamano = 16 }: Props) {
  return (
    <svg {...base(tamano)}>
      <path d="M9 6v12M15 6v12" strokeWidth={2.6} />
    </svg>
  )
}
