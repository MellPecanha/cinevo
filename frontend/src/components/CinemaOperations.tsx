import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'

import { CinemaSales } from './CinemaSales'
import { TicketCheckIn } from './TicketCheckIn'
import { createRoom, createSession, fetchManageableCinemas, fetchMovies, fetchRooms, fetchSessions, generateSeats, type ApiCinema, type ApiMovie, type ApiRoom, type ApiSession } from '../services/catalog-api'

type CinemaOperationsProps = { token: string }
type OperationsTab = 'rooms' | 'sessions' | 'sales' | 'checkin'
type SeatLayout = 'STANDARD' | 'MIXED'

const defaultRoomForm = {
  cinemaId: '', number: '', type: 'STANDARD' as ApiRoom['type'], layout: 'STANDARD' as SeatLayout, rows: '6', seatsPerRow: '8', accessibleSeats: 'A01, A02', vipSeats: '',
}

const defaultSessionForm = { movieId: '', cinemaId: '', roomId: '', startsAt: '', price: '32.00', recurrenceDays: [] as number[], recurrenceUntil: '' }

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function parseSeatCodes(value: string) {
  return value.split(',').map((seat) => seat.trim().toUpperCase()).filter(Boolean)
}

function formatDuration(duration: number) {
  return `${Math.floor(duration / 60)}h ${String(duration % 60).padStart(2, '0')}min`
}

export function CinemaOperations({ token }: CinemaOperationsProps) {
  const [tab, setTab] = useState<OperationsTab>('rooms')
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [movies, setMovies] = useState<ApiMovie[]>([])
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roomForm, setRoomForm] = useState(defaultRoomForm)
  const [sessionForm, setSessionForm] = useState(defaultSessionForm)

  const selectedMovie = movies.find((movie) => movie.id === Number(sessionForm.movieId))
  const roomsForSelectedCinema = useMemo(() => rooms.filter((room) => room.cinemaId === Number(sessionForm.cinemaId)), [rooms, sessionForm.cinemaId])
  const managedCinemaIds = useMemo(() => new Set(cinemas.map((cinema) => cinema.id)), [cinemas])
  const managedRooms = useMemo(() => rooms.filter((room) => managedCinemaIds.has(room.cinemaId)), [managedCinemaIds, rooms])
  const managedSessions = useMemo(() => sessions.filter((session) => managedCinemaIds.has(session.room.cinemaId)), [managedCinemaIds, sessions])

  const loadData = useCallback(async () => {
    const [cinemaItems, movieItems, roomItems, sessionItems] = await Promise.all([fetchManageableCinemas(token), fetchMovies(), fetchRooms(), fetchSessions()])
    setCinemas(cinemaItems)
    setMovies(movieItems)
    setRooms(roomItems)
    setSessions(sessionItems)
  }, [token])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- carrega dados externos ao abrir a área operacional.
    void loadData().catch(() => setFeedback('Não foi possível carregar os dados de operação.'))
  }, [loadData])

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')

    try {
      const room = await createRoom(token, { cinemaId: Number(roomForm.cinemaId), number: Number(roomForm.number), type: roomForm.type })
      await generateSeats(token, room.id, {
        rows: Number(roomForm.rows),
        seatsPerRow: Number(roomForm.seatsPerRow),
        accessibleSeats: parseSeatCodes(roomForm.accessibleSeats),
        vipSeats: roomForm.layout === 'MIXED' ? parseSeatCodes(roomForm.vipSeats) : [],
      })
      setRoomForm(defaultRoomForm)
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
      const result = await createSession(token, { movieId: Number(sessionForm.movieId), roomId: Number(sessionForm.roomId), startsAt: new Date(sessionForm.startsAt).toISOString(), price: Number(sessionForm.price), ...(sessionForm.recurrenceDays.length ? { recurrenceDays: sessionForm.recurrenceDays, recurrenceUntil: new Date(sessionForm.recurrenceUntil).toISOString() } : {}) })
      setSessionForm(defaultSessionForm)
      setFeedback(`${result.sessions.length} sessão(ões) publicada(s). O término foi calculado pela duração do filme.`)
      await loadData()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível publicar a sessão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <section>
    <nav className="admin-tabs admin-subtabs" aria-label="Operação do cinema"><button type="button" className={tab === 'rooms' ? 'active' : ''} onClick={() => setTab('rooms')}>Salas e assentos</button><button type="button" className={tab === 'sessions' ? 'active' : ''} onClick={() => setTab('sessions')}>Sessões</button><button type="button" className={tab === 'sales' ? 'active' : ''} onClick={() => setTab('sales')}>Vendas</button><button type="button" className={tab === 'checkin' ? 'active' : ''} onClick={() => setTab('checkin')}>Check-in</button></nav>

    {tab === 'rooms' && <div className="admin-workspace">
      <form className="admin-form" onSubmit={(event) => void submitRoom(event)}>
        <div><p className="eyebrow">Estrutura</p><h3>Nova sala</h3></div>
        <label>Cinema<select required value={roomForm.cinemaId} onChange={(event) => setRoomForm({ ...roomForm, cinemaId: event.target.value })}><option value="">Selecione</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select></label>
        <div className="admin-form-grid"><label>Número<input required min="1" type="number" value={roomForm.number} onChange={(event) => setRoomForm({ ...roomForm, number: event.target.value })} /></label><label>Perfil da sala<select value={roomForm.type} onChange={(event) => setRoomForm({ ...roomForm, type: event.target.value as ApiRoom['type'] })}><option value="STANDARD">Tradicional</option><option value="VIP">VIP, todos os assentos</option></select></label></div>
        <div className="admin-form-grid"><label>Fileiras<input required min="1" max="26" type="number" value={roomForm.rows} onChange={(event) => setRoomForm({ ...roomForm, rows: event.target.value })} /></label><label>Assentos/fileira<input required min="1" max="50" type="number" value={roomForm.seatsPerRow} onChange={(event) => setRoomForm({ ...roomForm, seatsPerRow: event.target.value })} /></label></div>
        {roomForm.type === 'STANDARD' && <label>Mapa de assentos<select value={roomForm.layout} onChange={(event) => setRoomForm({ ...roomForm, layout: event.target.value as SeatLayout, vipSeats: event.target.value === 'MIXED' ? roomForm.vipSeats : '' })}><option value="STANDARD">Tradicional</option><option value="MIXED">Misto, com lugares VIP</option></select></label>}
        {roomForm.type === 'STANDARD' && roomForm.layout === 'MIXED' && <label>Assentos VIP (B01, B02)<input value={roomForm.vipSeats} onChange={(event) => setRoomForm({ ...roomForm, vipSeats: event.target.value })} /></label>}
        <label>Acessíveis (A01, A02)<input value={roomForm.accessibleSeats} onChange={(event) => setRoomForm({ ...roomForm, accessibleSeats: event.target.value })} /></label>
        <p className="admin-form-hint">Em uma sala mista, informe os códigos dos lugares VIP. Assentos acessíveis são configurados separadamente.</p>
        <button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Configurando...' : 'Criar sala e assentos'}</button>
      </form>
      <section className="admin-list" aria-label="Salas cadastradas"><h3>Salas cadastradas</h3>{managedRooms.length ? managedRooms.map((room) => <article key={room.id}><strong>Sala {room.number} · {room.type === 'VIP' ? 'VIP' : 'Tradicional'}</strong><span>{cinemas.find((cinema) => cinema.id === room.cinemaId)?.name ?? `Cinema #${room.cinemaId}`}</span></article>) : <p className="empty-state">Nenhuma sala cadastrada.</p>}</section>
    </div>}

    {tab === 'sessions' && <div className="admin-workspace">
      <form className="admin-form" onSubmit={(event) => void submitSession(event)}>
        <div><p className="eyebrow">Programação</p><h3>Nova sessão</h3></div>
        <label>Filme<select required value={sessionForm.movieId} onChange={(event) => setSessionForm({ ...sessionForm, movieId: event.target.value })}><option value="">Selecione</option>{movies.map((movie) => <option key={movie.id} value={movie.id}>{movie.title}</option>)}</select></label>
        <label>Cinema<select required value={sessionForm.cinemaId} onChange={(event) => setSessionForm({ ...sessionForm, cinemaId: event.target.value, roomId: '' })}><option value="">Selecione</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name} · {cinema.city}</option>)}</select></label>
        <label>Sala<select required disabled={!sessionForm.cinemaId} value={sessionForm.roomId} onChange={(event) => setSessionForm({ ...sessionForm, roomId: event.target.value })}><option value="">{sessionForm.cinemaId ? 'Selecione' : 'Escolha um cinema primeiro'}</option>{roomsForSelectedCinema.map((room) => <option key={room.id} value={room.id}>Sala {room.number} · {room.type === 'VIP' ? 'VIP' : 'Tradicional'}</option>)}</select></label>
        <label>Início<input required type="datetime-local" value={sessionForm.startsAt} onChange={(event) => setSessionForm({ ...sessionForm, startsAt: event.target.value })} /></label>
        <p className="admin-form-hint">{selectedMovie ? `Término automático: ${formatDuration(selectedMovie.duration)} após o início.` : 'O término será calculado automaticamente pela duração do filme.'}</p>
        <fieldset className="admin-weekdays"><legend>Repetir nos dias da semana</legend><div>{weekDays.map((day, index) => <label key={day}><input type="checkbox" checked={sessionForm.recurrenceDays.includes(index)} onChange={() => setSessionForm({ ...sessionForm, recurrenceDays: sessionForm.recurrenceDays.includes(index) ? sessionForm.recurrenceDays.filter((value) => value !== index) : [...sessionForm.recurrenceDays, index] })} /> {day}</label>)}</div></fieldset>
        {sessionForm.recurrenceDays.length > 0 && <label>Repetir até<input required type="datetime-local" value={sessionForm.recurrenceUntil} onChange={(event) => setSessionForm({ ...sessionForm, recurrenceUntil: event.target.value })} /></label>}
        <label>Preço (R$)<input required min="0.01" step="0.01" type="number" value={sessionForm.price} onChange={(event) => setSessionForm({ ...sessionForm, price: event.target.value })} /></label>
        <button className="primary-action" disabled={isSubmitting} type="submit">{isSubmitting ? 'Publicando...' : 'Publicar sessão'}</button>
      </form>
      <section className="admin-list" aria-label="Sessões publicadas"><h3>Sessões publicadas</h3>{managedSessions.length ? managedSessions.map((session) => <article key={session.id}><strong>{session.movie?.title ?? `Filme #${session.movieId}`}</strong><span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(session.startsAt))} até {new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(session.endsAt))} · Sala {session.room.number} · R$ {session.price}</span></article>) : <p className="empty-state">Nenhuma sessão publicada.</p>}</section>
    </div>}

    {tab === 'sales' && <CinemaSales token={token} />}

    {tab === 'checkin' && <TicketCheckIn token={token} />}

    {feedback && <p className="reservation-message" role="status">{feedback}</p>}
  </section>
}
