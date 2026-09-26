import type { ApiMovie } from './services/catalog-api'

export type Movie = {
  id: number
  title: string
  genre: string
  duration: string
  classification: string
  description: string
  tone: string
  status: 'Em cartaz' | 'Em breve'
  release?: string
}

export const showcaseMovies: Movie[] = [
  { id: 1, title: 'Depois do Horizonte', genre: 'Ficção científica · Aventura', duration: '2h 18min', classification: '12', description: 'Uma piloto retorna à Terra para encontrar uma cidade que não reconhece mais.', tone: 'dune', status: 'Em cartaz' },
  { id: 2, title: 'Cidade em Chamas', genre: 'Drama · Suspense', duration: '1h 56min', classification: '14', description: 'Uma investigação noturna coloca duas famílias no centro de uma escolha impossível.', tone: 'ember', status: 'Em cartaz' },
  { id: 3, title: 'O Último Sinal', genre: 'Mistério · Thriller', duration: '2h 04min', classification: '16', description: 'Mensagens de rádio atravessam décadas e mudam o rumo de uma pequena cidade.', tone: 'signal', status: 'Em cartaz' },
  { id: 4, title: 'Maré Alta', genre: 'Romance · Drama', duration: '1h 48min', classification: '12', description: 'Duas pessoas se reencontram quando uma ilha começa a desaparecer do mapa.', tone: 'tide', status: 'Em breve', release: 'Estreia em 14 de outubro' },
  { id: 5, title: 'Bosque de Vidro', genre: 'Fantasia · Família', duration: '1h 42min', classification: 'Livre', description: 'Uma jovem descobre que as árvores de sua cidade guardam histórias vivas.', tone: 'forest', status: 'Em breve', release: 'Estreia em 28 de outubro' },
]

const classificationLabels: Record<ApiMovie['classification'], string> = {
  L: 'Livre', AGE_10: '10', AGE_12: '12', AGE_14: '14', AGE_16: '16', AGE_18: '18',
}

export function mapApiMovie(movie: ApiMovie, index: number): Movie {
  const fallback = showcaseMovies[index % showcaseMovies.length]

  return {
    ...fallback,
    id: movie.id,
    title: movie.title,
    description: movie.description ?? fallback.description,
    duration: `${Math.floor(movie.duration / 60)}h ${String(movie.duration % 60).padStart(2, '0')}min`,
    classification: classificationLabels[movie.classification],
    status: 'Em cartaz',
  }
}

export function formatSessionTime(startsAt: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(startsAt))
}

export function formatHoldTime(remainingSeconds: number) {
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
