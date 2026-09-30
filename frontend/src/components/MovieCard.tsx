import type { Movie } from '../catalog'

type MovieCardProps = {
  movie: Movie
  onSelect: (movie: Movie) => void
}

export function MovieCard({ movie, onSelect }: MovieCardProps) {
  const coverStyle = movie.coverUrl ? { backgroundImage: `url("${movie.coverUrl}")` } : undefined

  return <button className="movie-card" type="button" onClick={() => onSelect(movie)} aria-label={`Ver detalhes de ${movie.title}`}><span className={`movie-poster ${movie.tone} ${movie.coverUrl ? 'has-cover' : ''}`} style={coverStyle} aria-hidden="true"><span className="poster-kicker">Cinevo apresenta</span><strong>{movie.title}</strong><span className="poster-line" /></span><span className="movie-copy"><strong>{movie.title}</strong><span>{movie.genre}</span></span></button>
}
