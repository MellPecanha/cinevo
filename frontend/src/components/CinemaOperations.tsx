import { useEffect, useState, type FormEvent } from 'react'

import { createRoom, createSession, fetchCinemas, fetchMovies, fetchRooms, fetchSessions, generateSeats, type ApiCinema, type ApiMovie, type ApiRoom, type ApiSession } from '../services/catalog-api'

type CinemaOperationsProps = { token: string }
type OperationsTab = 'rooms' | 'sessions'

export function CinemaOperations({ token }: CinemaOperationsProps) {
  const [tab, setTab] = useState<OperationsTab>('rooms')
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [movies, setMovies] = useState<ApiMovie[]>([])
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roomForm, setRoomForm] = useState({ cinemaId: '', number: '', type: 'STANDARD' as ApiRoom['type'], rows: '6', seatsPerRow: '8', accessibleSeats: 'A01, A02' })
  const [sessionForm, setSessionForm] = useState({ movieId: '', roomId: '', startsAt: '', endsAt: '', price: '32.00' })

  const loadData = async () => {
    const [cinemaItems, movieItems, roomItems, sessionItems] = await Promise.all([fetchCinemas(), fetchMovies(), fetchRooms(), fetchSessions()])
    setCinemas(cinemaItems)
    setMovies(movieItems)
    setRooms(roomItems)
    setSessions(sessionItems)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carrega dados externos ao abrir a área operacional.
    void loadData().catch(() => setFeedback('Não foi possível carregar os dados de operação.'))
  }, [])

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')
    try {
      const room = await createRoom(token, { cinemaId: Number(roomForm.cinemaId), number: Number(roomForm.number), type: roomForm.type })
      const accessibleSeats = roomForm.accessibleSeats.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean)
      await generateSeats(token, room.id, { rows: Number(roomForm.rows), seatsPerRow: Number(roomForm.seatsPerRow), accessibleSeats })
      setRoomForm({ cinemaId: '', number: '', type: 'STANDARD', rows: '6', seatsPerRow: '8', accessibleSeats: 'A01, A02' })
      setFeedback(`Sala ${room.number} criada e mapa de assentos gerado.`)
      await loadData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível configurar a sala.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')
    try {
      await createSession(token, { movieId: Number(sessionForm.movieId), roomId: Number(sessionForm.roomId), startsAt: new Date(sessionForm.startsAt).toISOString(), endsAt: new Date(sessionForm.endsAt).toISOString(), price: Number(sessionForm.price) })
      setSessionForm({ movieId: '', roomId: '', startsAt: '', endsAt: '', price: '32.00' })
      setFeedback('Sessão publicada na programação.')
      await loadData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível publicar a sessão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <section><nav className="admin-tabs admin-subtabs" aria-label="Operação do cinema"><button type="button" className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>Salas e assentos</button><button type="button" className={tab === 'sessions' ? 'active' : ''} onClick={() => setTab('sessions')}>Sessões</button></nav>{tab === 'rooms' && <div className="admin-workspace"><form className="admin-form" onSubmit={(event) => void submitRoom(event)}><div><p className="eyebrow">Estrutura</p><h3>Nova sala</h3></div><label>Cinema<select required value={roomForm.cinemaId} onChange={(event) => setRoomForm({ ...roomForm, cinemaId: event.target.value })}><option value="">Selecione</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select></label><div className="admin-form-grid"><label>Número<input required min="1" type="number" value={roomForm.number} onChange={(event) => setRoomForm({ ...roomForm, number: event.target.value })} /></label><label>Tipo<select value={roomForm.type} onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value as ApiRoom['type'] })}><option value="STANDARD">Tradicional</option><option value="VIP">VIP</option></select></label></div><div className="admin-form-grid"><label>Fileiras<input required min="1" max="26" type="number" value={roomForm.rows} onChange={(event) => setRoomForm({ ...roomForm, rows: event.target.value })} /></label><label>Assentos/fileira<input required min="1" max="50" type="number" value={roomForm.seatsPerRow} onChange={(event) => setRoomForm({ ...roomForm, seatsPerRow: event.target.value })} /></label></div><label>Acessíveis (A01, A02)<input value={roomForm.accessibleSeats} onChange={(event) => setRoomForm({ ...roomForm, accessibleSeats: event.target.value })} /></label><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Configurando...' : 'Criar sala e assentos'}</button></form><section className="admin-list" aria-label="Salas cadastradas"><h3>Salas cadastradas</h3>{rooms.length ? rooms.map((room) => <article key={room.id}><strong>Sala {room.number} · {room.type === 'VIP' ? 'VIP' : 'Tradicional'}</strong><span>{cinemas.find((cinema) => cinema.id === room.cinemaId)?.name ?? `Cinema #${room.cinemaId}`}</span></article>) : <p className="empty-state">Nenhuma sala cadastrada.</p>}</section></div>}{tab === 'sessions' && <div className="admin-workspace"><form className="admin-form" onSubmit={(event) => void submitSession(event)}><div><p className="eyebrow">Programação</p><h3>Nova sessão</h3></div><label>Filme<select required value={sessionForm.movieId} onChange={(event) => setSessionForm({ ...sessionForm, movieId: event.target.value })}><option value="">Selecione</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select></label><label>Sala<select required value={sessionForm.roomId} onChange={(event) => setSessionForm({ ...sessionForm, roomId: event.target.value })}><option value="">Selecione</option>{rooms.map((room) => <option key={room.id} value={room.id}>{cinemas.find((cinema) => cinema.id === room.cinemaId)?.name ?? `Cinema #${room.cinemaId}`} · Sala {room.number}</option>)}</select></label><div className="admin-form-grid"><label>Início<input required type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm({ ...sessionForm, startsAt: event.target.value })} /></label><label>Término<input required type="datetime-local" value={sessionForm.endsAt} onChange={(event) => setSessionForm({ ...sessionForm, endsAt: event.target.value })} /></label></div><label>Preço (R$)<input required min="0.01" step="0.01" type="number" value={sessionForm.price} onChange={(event) => setSessionForm({ ...sessionForm, price: event.target.value })} /></label><button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Publicando...' : 'Publicar sessão'}</button></form><section className="admin-list" aria-label="Sessões publicadas"><h3>Sessões publicadas</h3>{sessions.length ? sessions.map((session) => <article key={session.id}><strong>{session.movie?.title ?? `Filme #${session.movieId}`}</strong><span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(session.startsAt))} · Sala {session.room.number} · R$ {session.price}</span></article>) : <p className="empty-state">Nenhuma sessão publicada.</p>}</section></div>}{feedback && <p className="reservation-message" role="status">{feedback}</p>}</section>
}
