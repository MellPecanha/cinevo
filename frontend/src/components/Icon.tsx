export type IconName = 'search' | 'ticket' | 'heart' | 'user' | 'play' | 'pin' | 'arrow'

export function Icon({ name }: { name: IconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg>
  if (name === 'ticket') return <svg {...common}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v2a2 2 0 0 0 0 4v2a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14.5v-2a2 2 0 0 0 0-4Z" /><path d="M12 4v13" strokeDasharray="2 2" /></svg>
  if (name === 'heart') return <svg {...common}><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.4a5.5 5.5 0 0 0-.1-7.8Z" /></svg>
  if (name === 'user') return <svg {...common}><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
  if (name === 'play') return <svg {...common}><path d="m9 7 8 5-8 5Z" fill="currentColor" /></svg>
  if (name === 'pin') return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>

  return <svg {...common}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
}
