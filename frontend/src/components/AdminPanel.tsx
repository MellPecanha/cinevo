import { useEffect, useState, type FormEvent } from 'react'

import { CinemaOperations } from './CinemaOperations'
import { UserManagement } from './UserManagement'
import type { DashboardMetrics } from '../services/catalog-api'
import { createCinema, createMovie, fetchCinemas, fetchMovies, type ApiCinema, type ApiMovie } from '../services/catalog-api'

type AdminTab = 'overview' | 'movies' | 'cinemas' | 'operations' | 'users'

type AdminPanelProps = {
  token: string
  metrics: DashboardMetrics | null
  message: string
  role: 'CINEMA_ADMIN' | 'PLATFORM_ADMIN'
  onClose: () => void
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function AdminPanel({ token, metrics, message, role, onClose }: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>(role === 'CINEMA_ADMIN' ? 'operations' : 'overview')
  const [movies, setMovies] = useState<ApiMovie[]>([])
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [movieForm, setMovieForm] = useState({ title: '', description: '', coverUrl: '', duration: '120', classification: 'AGE_12' as ApiMovie['classification'] })
  const [cinemaForm, setCinemaForm] = useState({ name: '', address: '', city: '', state: 'SP' })
  const isPlatformAdmin = role === 'PLATFORM_ADMIN'

  useEffect(() => {
    if (tab === 'overview' || tab === 'operations' || tab === 'users') return

    let active = true
    const load = tab === 'movies' ? fetchMovies().then((items) => { if (active) setMovies(items) }) : fetchCinemas().then((items) => { if (active) setCinemas(items) })

    load.catch(() => { if (active) setFeedback('Não foi possível carregar os dados administrativos.') })
    return () => { active = false }
  }, [tab])

  const submitMovie = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')
    try {
      const movie = await createMovie(token, { ...movieForm, duration: Number(movieForm.duration), description: movieForm.description || undefined, coverUrl: movieForm.coverUrl || undefined })
      setMovies((current) => [movie, ...current])
      setMovieForm({ title: '', description: '', coverUrl: '', duration: '120', classification: 'AGE_12' })
      setFeedback('Filme publicado no catálogo.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível publicar o filme.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitCinema = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')
    try {
      const cinema = await createCinema(token, { ...cinemaForm, state: cinemaForm.state.toUpperCase() })
      setCinemas((current) => [cinema, ...current])
      setCinemaForm({ name: '', address: '', city: '', state: 'SP' })
      setFeedback('Cinema cadastrado com sucesso.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível cadastrar o cinema.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <div className="tickets-overlay" role="presentation"><section className="tickets-panel dashboard-panel" role="dialog" aria-modal="true" aria-labelledby="dashboard-title"><header><div><p className="eyebrow">Administração</p><h2 id="dashboard-title">{isPlatformAdmin ? 'Operação Cinevo' : 'Meu cinema'}</h2></div><button className="close-sheet" type="button" onClick={onClose} aria-label="Fechar painel">×</button></header><nav className="admin-tabs" aria-label="Seções administrativas">{isPlatformAdmin && <><button type="button" className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Visão geral</button><button type="button" className={tab === 'movies' ? 'active' : ''} onClick={() => setTab('movies')}>Filmes</button><button type="button" className={tab === 'cinemas' ? 'active' : ''} onClick={() => setTab('cinemas')}>Cinemas</button></>}<button type="button" className={tab === 'operations' ? 'active' : ''} onClick={() => setTab('operations')}>{isPlatformAdmin ? 'Salas e sessões' : 'Operação do cinema'}</button>{isPlatformAdmin && <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>Usuários</button>}</nav>{tab === 'overview' && isPlatformAdmin && (message ? <p className="empty-state">{message}</p> : metrics && <div className="metric-grid"><article><span>Cinemas</span><strong>{metrics.cinemas}</strong></article><article><span>Filmes</span><strong>{metrics.movies}</strong></article><article><span>Pedidos pagos</span><strong>{metrics.paidOrders}</strong></article><article><span>Ingressos ativos</span><strong>{metrics.activeTickets}</strong></article><article className="revenue-metric"><span>Receita confirmada</span><strong>{currencyFormatter.format(Number(metrics.revenue))}</strong></article></div>)}{tab === 'movies' && isPlatformAdmin && <div className="admin-workspace"><form className="admin-form" onSubmit={(event) => void submitMovie(event)}><div><p className="eyebrow">Catálogo</p><h3>Novo filme</h3></div><label>Título<input required value={movieForm.title} onChange={(event) => setMovieForm({ ...movieForm, title: event.target.value })} /></label><label>Descrição<textarea value={movieForm.description} onChange={(event) => setMovieForm({ ...movieForm, description: event.target.value })} /></label><div className="admin-form-grid"><label>Duração (min)<input required min="1" type="number" value={movieForm.duration} onChange={(event) => setMovieForm({ ...movieForm, duration: event.target.value })} /></label><label>Classificação<select value={movieForm.classification} onChange={(event) => setMovieForm({ ...movieForm, classification: event.target.value as ApiMovie['classification'] })}><option value="L">Livre</option><option value="AGE_10">10 anos</option><option value="AGE_12">12 anos</option><option value="AGE_14">14 anos</option><option value="AGE_16">16 anos</option><option value="AGE_18">18 anos</option></select></label></div><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Publicando...' : 'Publicar filme'}</button></form><section className="admin-list" aria-label="Filmes cadastrados"><h3>Filmes cadastrados</h3>{movies.length ? movies.map((movie) => <article key={movie.id}><strong>{movie.title}</strong><span>{movie.duration} min · {movie.classification}</span></article>) : <p className="empty-state">Carregando catálogo...</p>}</section></div>}{tab === 'cinemas' && isPlatformAdmin && <div className="admin-workspace"><form className="admin-form" onSubmit={(event) => void submitCinema(event)}><div><p className="eyebrow">Rede</p><h3>Novo cinema</h3></div><label>Nome<input required value={cinemaForm.name} onChange={(event) => setCinemaForm({ ...cinemaForm, name: event.target.value })} /></label><label>Endereço<input required value={cinemaForm.address} onChange={(event) => setCinemaForm({ ...cinemaForm, address: event.target.value })} /></label><div className="admin-form-grid"><label>Cidade<input required value={cinemaForm.city} onChange={(event) => setCinemaForm({ ...cinemaForm, city: event.target.value })} /></label><label>UF<input required minLength={2} maxLength={2} value={cinemaForm.state} onChange={(event) => setCinemaForm({ ...cinemaForm, state: event.target.value })} /></label></div><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Cadastrando...' : 'Cadastrar cinema'}</button></form><section className="admin-list" aria-label="Cinemas cadastrados"><h3>Cinemas cadastrados</h3>{cinemas.length ? cinemas.map((cinema) => <article key={cinema.id}><strong>{cinema.name}</strong><span>{cinema.city}, {cinema.state} · {cinema.address}</span></article>) : <p className="empty-state">Carregando cinemas...</p>}</section></div>}{tab === 'operations' && <CinemaOperations token={token} />}{tab === 'users' && isPlatformAdmin && <UserManagement token={token} />}{feedback && <p className="reservation-message" role="status">{feedback}</p>}</section></div>
}
