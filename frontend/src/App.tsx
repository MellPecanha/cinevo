import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { formatHoldTime, formatSessionTime, mapApiMovie, showcaseMovies, type Movie } from './catalog'
import { Icon } from './components/Icon'
import { MovieCard } from './components/MovieCard'
import { addFavorite, cancelOrder, createOrder, fetchCinemas, fetchCurrentUser, fetchDashboard, fetchFavorites, fetchMovies, fetchSessionSeats, fetchSessions, fetchTicketQrCode, fetchTickets, loginCustomer, payOrder, registerCustomer, removeFavorite, type ApiCinema, type ApiFavorite, type ApiSeat, type ApiSession, type ApiTicket, type AuthUser, type DashboardMetrics } from './services/catalog-api'
import './App.css'

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function App() {
  const [query, setQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [notice, setNotice] = useState('')
  const [catalogMovies, setCatalogMovies] = useState<Movie[]>(showcaseMovies)
  const [sessions, setSessions] = useState<ApiSession[]>([])
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [sessionSeats, setSessionSeats] = useState<ApiSeat[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([])
  const [isLoadingSeats, setIsLoadingSeats] = useState(false)
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('cinevo.token'))
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservationMessage, setReservationMessage] = useState('')
  const [reservedOrderId, setReservedOrderId] = useState<number | null>(null)
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null)
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now())
  const [isPaymentComplete, setIsPaymentComplete] = useState(false)
  const [isTicketsOpen, setIsTicketsOpen] = useState(false)
  const [tickets, setTickets] = useState<ApiTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [ticketMessage, setTicketMessage] = useState('')
  const [ticketQrCodes, setTicketQrCodes] = useState<Record<string, string>>({})
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [profileMessage, setProfileMessage] = useState('')
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null)
  const [ticketTab, setTicketTab] = useState<'upcoming' | 'history'>('upcoming')
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)
  const [favorites, setFavorites] = useState<Movie[]>([])
  const [favoritesMessage, setFavoritesMessage] = useState('')
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null)
  const [dashboardMessage, setDashboardMessage] = useState('')

  useEffect(() => {
    let active = true

    fetchMovies()
      .then((apiMovies) => {
        if (active && apiMovies.length > 0) {
          setCatalogMovies(apiMovies.map(mapApiMovie))
          setNotice('Programação atualizada.')
        }
      })
      .catch(() => {
        if (active) setNotice('Exibindo a programação de demonstração enquanto a API não está disponível.')
      })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedSessionId) return

    let active = true
    // oxlint-disable-next-line react/set-state-in-effect -- inicia o estado visual de uma consulta externa.
    setIsLoadingSeats(true)
    // oxlint-disable-next-line react/set-state-in-effect -- evita continuar com assentos da sessão anterior.
    setSelectedSeatIds([])

    fetchSessionSeats(selectedSessionId)
      .then((seats) => { if (active) setSessionSeats(seats) })
      .catch(() => { if (active) setNotice('Não foi possível carregar os assentos desta sessão.') })
      .finally(() => { if (active) setIsLoadingSeats(false) })

    return () => { active = false }
  }, [selectedSessionId])

  useEffect(() => {
    if (!holdExpiresAt || isPaymentComplete) return

    const intervalId = window.setInterval(() => setCurrentTimestamp(Date.now()), 1000)

    return () => window.clearInterval(intervalId)
  }, [holdExpiresAt, isPaymentComplete])

  useEffect(() => {
    let active = true

    Promise.all([fetchCinemas(), fetchSessions()])
      .then(([apiCinemas, apiSessions]) => {
        if (!active) return
        setCinemas(apiCinemas)
        setSessions(apiSessions)
      })
      .catch(() => {
        if (active) setNotice('Cinemas e sessões aparecerão quando a API estiver disponível.')
      })

    return () => { active = false }
  }, [])

  const filteredMovies = useMemo(() => { const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR'); return normalizedQuery ? catalogMovies.filter((movie) => `${movie.title} ${movie.genre}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)) : catalogMovies }, [query, catalogMovies])
  const nowShowing = filteredMovies.filter((movie) => movie.status === 'Em cartaz')
  const comingSoon = filteredMovies.filter((movie) => movie.status === 'Em breve')
  const featuredMovie = nowShowing[0] ?? catalogMovies[0] ?? showcaseMovies[0]
  const selectedSessions = useMemo(() => selectedMovie ? sessions.filter((session) => session.movieId === selectedMovie.id) : [], [selectedMovie, sessions])
  const sessionsByCinema = useMemo(() => selectedSessions.reduce<Record<number, ApiSession[]>>((groups, session) => ({ ...groups, [session.room.cinemaId]: [...(groups[session.room.cinemaId] ?? []), session] }), {}), [selectedSessions])
  const seatsByRow = useMemo(() => sessionSeats.reduce<Record<string, ApiSeat[]>>((rows, seat) => ({ ...rows, [seat.row]: [...(rows[seat.row] ?? []), seat] }), {}), [sessionSeats])
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null
  const selectedSeatCount = selectedSeatIds.length
  const selectedTotal = selectedSession ? Number(selectedSession.price) * selectedSeatCount : 0
  const holdRemainingSeconds = holdExpiresAt ? Math.max(0, Math.ceil((new Date(holdExpiresAt).getTime() - currentTimestamp) / 1000)) : null
  const isHoldExpired = holdRemainingSeconds === 0
  const visibleTickets = tickets.filter((ticket) => ticketTab === 'upcoming'
    ? ticket.status === 'ACTIVE' && new Date(ticket.session.startsAt) >= new Date()
    : ticket.status !== 'ACTIVE' || new Date(ticket.session.startsAt) < new Date())
  const isFavorite = (movieId: number) => favorites.some((movie) => movie.id === movieId)
  const selectMovie = (movie: Movie) => { setSelectedMovie(movie); setSelectedSessionId(null); setSessionSeats([]); setSelectedSeatIds([]); setNotice(`Detalhes de ${movie.title} carregados.`) }
  const showSeatSelection = () => {
    window.requestAnimationFrame(() => {
      const seatSelection = document.getElementById('seats')
      seatSelection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      seatSelection?.focus({ preventScroll: true })
    })
  }
  const toggleSeat = (seat: ApiSeat) => {
    if (seat.status !== 'AVAILABLE') return
    setSelectedSeatIds((current) => current.includes(seat.id) ? current.filter((id) => id !== seat.id) : [...current, seat.id])
  }
  const refreshSeatAvailability = async (sessionId = selectedSessionId) => {
    if (!sessionId) return

    try {
      setSessionSeats(await fetchSessionSeats(sessionId))
    } catch {
      setNotice('A reserva foi atualizada, mas não foi possível atualizar o mapa de assentos.')
    }
  }
  const reserveSeats = async (token: string) => {
    if (!selectedSessionId || selectedSeatIds.length === 0) return
    setIsSubmitting(true)
    setReservationMessage('')
    try {
      const order = await createOrder(token, selectedSessionId, selectedSeatIds)
      setReservedOrderId(order.id)
      setHoldExpiresAt(order.expiresAt)
      setCurrentTimestamp(Date.now())
      setIsPaymentComplete(false)
      setReservationMessage(`Reserva criada até ${new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(order.expiresAt))}. Pedido #${order.id}.`)
      setNotice('Reserva temporária criada com sucesso.')
      await refreshSeatAvailability(selectedSessionId)
    } catch (error) {
      setReservationMessage(error instanceof Error ? error.message : 'Não foi possível reservar os assentos.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const confirmPayment = async () => {
    if (!authToken || !reservedOrderId) return
    setIsSubmitting(true)
    setReservationMessage('')
    try {
      const payment = await payOrder(authToken, reservedOrderId)
      setIsPaymentComplete(true)
      setHoldExpiresAt(null)
      setReservationMessage(`${payment.tickets.length} ingresso(s) confirmado(s). Seus códigos estarão disponíveis em “Ingressos”.`)
      setNotice('Pagamento confirmado e ingressos emitidos.')
      await refreshSeatAvailability()
    } catch (error) {
      setReservationMessage(error instanceof Error ? error.message : 'Não foi possível confirmar o pagamento.')
    } finally {
      setIsSubmitting(false)
    }
  }
  const openTickets = async () => {
    if (!authToken) {
      setAuthMode('login')
      setIsAuthOpen(true)
      setNotice('Entre para visualizar seus ingressos.')
      return
    }
    setIsTicketsOpen(true)
    setTicketTab('upcoming')
    setIsLoadingTickets(true)
    setTicketMessage('')
    try {
      setTickets(await fetchTickets(authToken))
    } catch (error) {
      setTicketMessage(error instanceof Error ? error.message : 'Não foi possível carregar seus ingressos.')
    } finally {
      setIsLoadingTickets(false)
    }
  }
  const showTicketQrCode = async (code: string) => {
    if (!authToken || ticketQrCodes[code]) return
    try {
      const qrCode = await fetchTicketQrCode(authToken, code)
      setTicketQrCodes((current) => ({ ...current, [code]: qrCode.qrCodeDataUrl }))
    } catch (error) {
      setTicketMessage(error instanceof Error ? error.message : 'Não foi possível carregar o QR Code.')
    }
  }
  const openProfile = async () => {
    if (!authToken) {
      setAuthMode('login')
      setIsAuthOpen(true)
      setNotice('Entre para acessar seu perfil.')
      return
    }
    setIsProfileOpen(true)
    setProfileMessage('Carregando perfil...')
    try {
      setCurrentUser(await fetchCurrentUser(authToken))
      setProfileMessage('')
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : 'Não foi possível carregar seu perfil.')
    }
  }
  const signOut = () => {
    sessionStorage.removeItem('cinevo.token')
    setAuthToken(null)
    setCurrentUser(null)
    setIsProfileOpen(false)
    setNotice('Você saiu da sua conta.')
  }
  const openDashboard = async () => {
    if (!authToken) return
    setIsDashboardOpen(true)
    setDashboardMessage('Carregando métricas...')
    try {
      setDashboardMetrics(await fetchDashboard(authToken))
      setDashboardMessage('')
    } catch (error) {
      setDashboardMessage(error instanceof Error ? error.message : 'Não foi possível carregar as métricas.')
    }
  }
  const confirmCancellation = async () => {
    if (!authToken || !orderToCancel) return
    setIsSubmitting(true)
    setTicketMessage('')
    try {
      await cancelOrder(authToken, orderToCancel)
      setTickets(await fetchTickets(authToken))
      setOrderToCancel(null)
      setTicketMessage('Pedido cancelado. Os ingressos deste pedido não são mais válidos.')
    } catch (error) {
      setTicketMessage(error instanceof Error ? error.message : 'Não foi possível cancelar o pedido.')
      setOrderToCancel(null)
    } finally {
      setIsSubmitting(false)
    }
  }
  const openFavorites = async () => {
    if (!authToken) {
      setAuthMode('login')
      setIsAuthOpen(true)
      setNotice('Entre para acessar seus favoritos.')
      return
    }
    setIsFavoritesOpen(true)
    setFavoritesMessage('Carregando favoritos...')
    try {
      const response = await fetchFavorites(authToken)
      setFavorites(response.map((favorite: ApiFavorite, index) => mapApiMovie(favorite.movie, index)))
      setFavoritesMessage('')
    } catch (error) {
      setFavoritesMessage(error instanceof Error ? error.message : 'Não foi possível carregar os favoritos.')
    }
  }
  const toggleFavorite = async (movie: Movie) => {
    if (!authToken) {
      setAuthMode('login')
      setIsAuthOpen(true)
      setNotice('Entre para salvar filmes nos favoritos.')
      return
    }
    try {
      if (isFavorite(movie.id)) {
        await removeFavorite(authToken, movie.id)
        setFavorites((current) => current.filter((item) => item.id !== movie.id))
        setNotice(`${movie.title} removido dos favoritos.`)
      } else {
        await addFavorite(authToken, movie.id)
        setFavorites((current) => [...current, movie])
        setNotice(`${movie.title} salvo nos favoritos.`)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Não foi possível atualizar os favoritos.')
    }
  }
  const proceedToReservation = () => {
    if (!authToken) { setIsAuthOpen(true); return }
    void reserveSeats(authToken)
  }
  const restartExpiredReservation = () => {
    setReservedOrderId(null)
    setHoldExpiresAt(null)
    setReservationMessage('Sua reserva expirou. Se os assentos ainda estiverem disponíveis, você pode reservá-los novamente.')
    setNotice('Reserva expirada. Selecione “Continuar” para tentar uma nova reserva.')
    void refreshSeatAvailability()
  }
  const submitAuthentication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setReservationMessage('')
    try {
      if (authMode === 'register') await registerCustomer(authForm.name, authForm.email, authForm.password)
      const result = await loginCustomer(authForm.email, authForm.password)
      sessionStorage.setItem('cinevo.token', result.token)
      setAuthToken(result.token)
      setIsAuthOpen(false)
      setNotice(`Olá, ${result.user.name}. Agora vamos reservar seus assentos.`)
      await reserveSeats(result.token)
    } catch (error) {
      setReservationMessage(error instanceof Error ? error.message : 'Não foi possível autenticar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="app-shell">
    <a className="skip-link" href="#catalogo">Pular para o catálogo</a>
    <header className="topbar"><a className="brand" href="#inicio" aria-label="Cinevo, página inicial"><img className="brand-mark" src="/favicon.svg" alt="" /><span>cinevo</span></a><div className="header-actions">{selectedMovie && <button className={`favorite-toggle ${isFavorite(selectedMovie.id) ? 'saved' : ''}`} type="button" onClick={() => void toggleFavorite(selectedMovie)} aria-pressed={isFavorite(selectedMovie.id)} aria-label={isFavorite(selectedMovie.id) ? 'Remover filme dos favoritos' : 'Adicionar filme aos favoritos'}><Icon name="heart" /></button>}<button className="location" type="button" onClick={() => setNotice('A escolha de cidade será adicionada junto à busca de cinemas.')}><Icon name="pin" /> São Paulo</button><button className="sign-in" type="button" onClick={() => { setAuthMode('login'); setIsAuthOpen(true) }}>Entrar</button></div></header>
    <section className="intro" id="inicio" aria-labelledby="intro-title"><div><p className="eyebrow">Cinema perto de você</p><h1 id="intro-title">Escolha a próxima história para viver.</h1><p className="intro-description">Explore a programação sem criar uma conta. Quando decidir, você escolhe cinema, horário e assento em poucos passos.</p></div><label className="search-field"><span className="sr-only">Buscar filmes</span><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar filmes, gêneros..." type="search" /></label></section>
    <section className="featured" aria-labelledby="featured-title"><div className="featured-art" aria-hidden="true"><span>NO CINEMA</span><i /></div><div className="featured-content"><p className="status-pill">Em cartaz</p><p className="featured-genre">{featuredMovie.genre}</p><h2 id="featured-title">{featuredMovie.title}</h2><p>{featuredMovie.description}</p><div className="featured-meta"><span>{featuredMovie.duration}</span><span>{featuredMovie.classification} anos</span></div><div className="featured-actions"><button className="primary-action" type="button" onClick={() => selectMovie(featuredMovie)}><Icon name="ticket" /> Ver sessões</button><button className="quiet-action" type="button" onClick={() => setNotice('O trailer ficará disponível quando os conteúdos de filmes forem integrados.')}><Icon name="play" /> Trailer</button></div></div></section>
    <section className="catalog" id="catalogo" aria-labelledby="now-showing-title"><div className="section-heading"><div><p className="eyebrow">Programação</p><h2 id="now-showing-title">Em cartaz agora</h2></div><span>{nowShowing.length} filmes</span></div>{nowShowing.length ? <div className="movie-grid">{nowShowing.map((movie) => <MovieCard key={movie.id} movie={movie} onSelect={selectMovie} />)}</div> : <p className="empty-state">Nenhum filme encontrado. Tente outra busca.</p>}</section>
    <section className="catalog coming-soon" aria-labelledby="coming-soon-title"><div className="section-heading"><div><p className="eyebrow">Para planejar</p><h2 id="coming-soon-title">Em breve</h2></div></div>{comingSoon.length > 0 && <div className="movie-grid">{comingSoon.map((movie) => <MovieCard key={movie.id} movie={movie} onSelect={selectMovie} />)}</div>}</section>
    {selectedMovie && <aside className="movie-sheet" aria-labelledby="sheet-title"><div className={`sheet-poster ${selectedMovie.tone}`} aria-hidden="true" /><div className="sheet-details"><button className="close-sheet" type="button" onClick={() => setSelectedMovie(null)} aria-label="Fechar detalhes">×</button><p className="eyebrow">{selectedMovie.status}</p><h2 id="sheet-title">{selectedMovie.title}</h2><p>{selectedMovie.description}</p><p className="sheet-meta">{selectedMovie.genre} · {selectedMovie.duration} · {selectedMovie.classification} anos</p>{selectedMovie.release && <p className="release">{selectedMovie.release}</p>}<section className="session-picker" aria-labelledby="sessions-title"><h3 id="sessions-title">Escolha cinema e horário</h3>{Object.entries(sessionsByCinema).length > 0 ? Object.entries(sessionsByCinema).map(([cinemaId, cinemaSessions]) => { const cinema = cinemas.find((item) => item.id === Number(cinemaId)); return <div className="cinema-session" key={cinemaId}><p><strong>{cinema?.name ?? 'Cinema parceiro'}</strong><span>{cinema ? `${cinema.city}, ${cinema.state} · Sala ${cinemaSessions[0].room.number}` : `Sala ${cinemaSessions[0].room.number}`}</span></p><div className="time-options">{cinemaSessions.map((session) => <button className={selectedSessionId === session.id ? 'selected-time' : ''} type="button" key={session.id} onClick={() => { setSelectedSessionId(session.id); setNotice(`Sessão das ${formatSessionTime(session.startsAt)} selecionada.`) }} aria-pressed={selectedSessionId === session.id}>{formatSessionTime(session.startsAt)}</button>)}</div></div> }) : <p className="no-sessions">Ainda não há sessões publicadas para este filme.</p>}</section><button className="primary-action" type="button" disabled={!selectedSessionId} onClick={showSeatSelection}><Icon name="arrow" /> Escolher assentos</button></div></aside>}
    {selectedMovie && selectedSession && <section className="seat-selection" id="seats" tabIndex={-1} aria-labelledby="seats-title"><div className="seat-heading"><div><p className="eyebrow">Etapa 3 de 4</p><h2 id="seats-title">Escolha seus assentos</h2><p>{formatSessionTime(selectedSession.startsAt)} · Sala {selectedSession.room.number} · {selectedSession.room.type === 'VIP' ? 'VIP' : 'Tradicional'}</p></div><span>{currencyFormatter.format(Number(selectedSession.price))} por ingresso</span></div>{isLoadingSeats ? <p className="empty-state">Carregando mapa de assentos...</p> : sessionSeats.length > 0 ? <><div className="screen" aria-hidden="true"><span>TELA</span></div><div className="seat-map" role="group" aria-label="Mapa de assentos">{Object.entries(seatsByRow).map(([row, rowSeats]) => <div className="seat-row" key={row}><span>{row}</span><div>{rowSeats.map((seat) => <button key={seat.id} className={`seat ${seat.status.toLowerCase()} ${selectedSeatIds.includes(seat.id) ? 'selected' : ''}`} type="button" onClick={() => toggleSeat(seat)} disabled={seat.status !== 'AVAILABLE'} aria-pressed={selectedSeatIds.includes(seat.id)} aria-label={`Assento ${seat.row}${seat.number}, ${seat.status === 'AVAILABLE' ? 'disponível' : seat.status === 'HELD' ? 'em reserva' : 'vendido'}`}>{seat.number}</button>)}</div><span>{row}</span></div>)}</div><div className="seat-legend" aria-label="Legenda"><span><i className="available" />Disponível</span><span><i className="selected" />Selecionado</span><span><i className="sold" />Indisponível</span></div></> : <p className="empty-state">Esta sala ainda não possui assentos cadastrados.</p>}<footer className="seat-summary"><div><span>Assentos selecionados</span><strong>{selectedSeatCount ? sessionSeats.filter((seat) => selectedSeatIds.includes(seat.id)).map((seat) => `${seat.row}${seat.number}`).join(', ') : 'Nenhum assento'}</strong></div><div><span>Total</span><strong>{currencyFormatter.format(selectedTotal)}</strong></div><button className="primary-action" type="button" disabled={selectedSeatCount === 0 || isSubmitting} onClick={proceedToReservation}><Icon name="arrow" /> {isSubmitting ? 'Reservando...' : 'Continuar'}</button></footer>{reservationMessage && <p className="reservation-message" role="status">{reservationMessage}</p>}</section>}
    {isAuthOpen && <div className="auth-dialog-backdrop" role="presentation"><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="close-sheet" type="button" onClick={() => setIsAuthOpen(false)} aria-label="Fechar identificação">×</button><p className="eyebrow">Etapa 4 de 4</p><h2 id="auth-title">{authMode === 'login' ? 'Entre para reservar' : 'Crie sua conta'}</h2><p>Seus assentos serão reservados por 10 minutos antes do pagamento.</p><form onSubmit={(event) => void submitAuthentication(event)}>{authMode === 'register' && <label>Nome<input required minLength={2} value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} autoComplete="name" /></label>}<label>E-mail<input required type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} autoComplete="email" /></label><label>Senha<input required type="password" minLength={8} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} /></label><button className="primary-action" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Aguarde...' : authMode === 'login' ? 'Entrar e reservar' : 'Criar conta e reservar'}</button></form><button className="auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setReservationMessage('') }}>{authMode === 'login' ? 'Ainda não tem conta? Criar conta' : 'Já possui conta? Entrar'}</button>{reservationMessage && <p className="reservation-message" role="alert">{reservationMessage}</p>}</section></div>}
    {reservedOrderId && <section className="checkout-card" aria-labelledby="checkout-title"><div><p className="eyebrow">Checkout</p><h2 id="checkout-title">{isPaymentComplete ? 'Ingressos confirmados' : 'Revise e confirme'}</h2><p>{selectedMovie?.title} · {selectedSeatCount} ingresso(s) · {selectedSeatCount ? sessionSeats.filter((seat) => selectedSeatIds.includes(seat.id)).map((seat) => `${seat.row}${seat.number}`).join(', ') : ''}</p></div><div className="checkout-total"><span>Total</span><strong>{currencyFormatter.format(selectedTotal)}</strong></div>{!isPaymentComplete && <div className={`hold-timer ${isHoldExpired ? 'expired' : ''}`} role="timer" aria-live="off"><span>{isHoldExpired ? 'Reserva expirada' : 'Tempo para pagar'}</span><strong>{isHoldExpired ? '00:00' : formatHoldTime(holdRemainingSeconds ?? 0)}</strong></div>}{!isPaymentComplete && !isHoldExpired && <button className="primary-action" type="button" disabled={isSubmitting} onClick={() => void confirmPayment()}><Icon name="ticket" /> {isSubmitting ? 'Confirmando...' : 'Pagar e confirmar'}</button>}{isHoldExpired && <button className="quiet-action" type="button" onClick={restartExpiredReservation}>Reservar novamente</button>}{isPaymentComplete && <button className="primary-action" type="button" onClick={() => void openTickets()}><Icon name="ticket" /> Ver meus ingressos</button>}{reservationMessage && <p className="reservation-message" role="status">{reservationMessage}</p>}</section>}
    {isTicketsOpen && <div className="tickets-overlay" role="presentation"><section className="tickets-panel" role="dialog" aria-modal="true" aria-labelledby="tickets-title"><header><div><p className="eyebrow">Minha conta</p><h2 id="tickets-title">Meus ingressos</h2></div><button className="close-sheet" type="button" onClick={() => setIsTicketsOpen(false)} aria-label="Fechar ingressos">×</button></header>{isLoadingTickets ? <p className="empty-state">Carregando ingressos...</p> : tickets.length > 0 ? <><div className="ticket-tabs" role="tablist" aria-label="Filtro de ingressos"><button type="button" role="tab" aria-selected={ticketTab === 'upcoming'} className={ticketTab === 'upcoming' ? 'active' : ''} onClick={() => setTicketTab('upcoming')}>Próximos</button><button type="button" role="tab" aria-selected={ticketTab === 'history'} className={ticketTab === 'history' ? 'active' : ''} onClick={() => setTicketTab('history')}>Histórico</button></div>{visibleTickets.length > 0 ? <div className="ticket-list">{visibleTickets.map((ticket) => <article className="ticket-card" key={ticket.id}><div><p className="ticket-status">{ticket.status === 'ACTIVE' ? 'Válido' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}</p><h3>{ticket.session.movie.title}</h3><p>{ticket.session.room.cinema.name} · {ticket.session.room.cinema.city}</p><dl><div><dt>Data e horário</dt><dd>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ticket.session.startsAt))}</dd></div><div><dt>Assento</dt><dd>{ticket.seat.row}{ticket.seat.number} · Sala {ticket.session.room.number}</dd></div></dl></div>{ticket.status === 'ACTIVE' && <div className="ticket-qr"><button type="button" onClick={() => void showTicketQrCode(ticket.code)}>{ticketQrCodes[ticket.code] ? <img src={ticketQrCodes[ticket.code]} alt={`QR Code do ingresso de ${ticket.session.movie.title}`} /> : 'Mostrar QR Code'}</button><small>Código: {ticket.code}</small><button className="cancel-ticket" type="button" onClick={() => setOrderToCancel(ticket.orderId)}>Cancelar pedido</button></div>}</article>)}</div> : <p className="empty-state">{ticketTab === 'upcoming' ? 'Você não tem ingressos futuros.' : 'Ainda não há ingressos no histórico.'}</p>}{ticketMessage && <p className="reservation-message" role="status">{ticketMessage}</p>}</> : <p className="empty-state">{ticketMessage || 'Você ainda não tem ingressos confirmados.'}</p>}</section></div>}
    {isProfileOpen && <div className="tickets-overlay" role="presentation"><section className="profile-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title"><header><div><p className="eyebrow">Minha conta</p><h2 id="profile-title">Meu perfil</h2></div><button className="close-sheet" type="button" onClick={() => setIsProfileOpen(false)} aria-label="Fechar perfil">×</button></header>{profileMessage ? <p className="empty-state">{profileMessage}</p> : currentUser && <><div className="profile-identity"><span>{currentUser.name.slice(0, 1).toUpperCase()}</span><div><h3>{currentUser.name}</h3><p>{currentUser.role === 'CUSTOMER' ? 'Cliente Cinevo' : currentUser.role}</p></div></div><dl className="profile-details"><div><dt>E-mail</dt><dd>{currentUser.email}</dd></div><div><dt>Telefone</dt><dd>{currentUser.phone ?? 'Não informado'}</dd></div><div><dt>Cliente desde</dt><dd>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(currentUser.createdAt))}</dd></div></dl>{currentUser.role === 'PLATFORM_ADMIN' && <button className="admin-link" type="button" onClick={() => void openDashboard()}>Abrir painel administrativo</button>}<button className="sign-out" type="button" onClick={signOut}>Sair da conta</button></>}</section></div>}
    {orderToCancel && <div className="auth-dialog-backdrop" role="presentation"><section className="auth-dialog cancellation-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><button className="close-sheet" type="button" onClick={() => setOrderToCancel(null)} aria-label="Fechar confirmação">×</button><p className="eyebrow">Cancelar pedido</p><h2 id="cancel-title">Deseja cancelar todos os ingressos?</h2><p>Esta ação cancela todos os ingressos do pedido e só é permitida até duas horas antes da sessão.</p><div className="cancel-actions"><button className="quiet-action" type="button" onClick={() => setOrderToCancel(null)}>Manter pedido</button><button className="danger-action" type="button" disabled={isSubmitting} onClick={() => void confirmCancellation()}>{isSubmitting ? 'Cancelando...' : 'Cancelar pedido'}</button></div></section></div>}
    {isFavoritesOpen && <div className="tickets-overlay" role="presentation"><section className="tickets-panel favorites-panel" role="dialog" aria-modal="true" aria-labelledby="favorites-title"><header><div><p className="eyebrow">Minha coleção</p><h2 id="favorites-title">Favoritos</h2></div><button className="close-sheet" type="button" onClick={() => setIsFavoritesOpen(false)} aria-label="Fechar favoritos">×</button></header>{favoritesMessage ? <p className="empty-state">{favoritesMessage}</p> : favorites.length > 0 ? <div className="favorite-list">{favorites.map((movie) => <article className={`favorite-item ${movie.tone}`} key={movie.id}><button className="favorite-open" type="button" onClick={() => { setIsFavoritesOpen(false); selectMovie(movie) }}><strong>{movie.title}</strong><span>{movie.genre} · {movie.duration}</span></button><button className="favorite-remove" type="button" onClick={() => void toggleFavorite(movie)} aria-label={`Remover ${movie.title} dos favoritos`}>×</button></article>)}</div> : <p className="empty-state">Salve filmes para encontrá-los rapidamente aqui.</p>}</section></div>}
    {isDashboardOpen && <div className="tickets-overlay" role="presentation"><section className="tickets-panel dashboard-panel" role="dialog" aria-modal="true" aria-labelledby="dashboard-title"><header><div><p className="eyebrow">Administração</p><h2 id="dashboard-title">Visão geral</h2></div><button className="close-sheet" type="button" onClick={() => setIsDashboardOpen(false)} aria-label="Fechar painel">×</button></header>{dashboardMessage ? <p className="empty-state">{dashboardMessage}</p> : dashboardMetrics && <div className="metric-grid"><article><span>Cinemas</span><strong>{dashboardMetrics.cinemas}</strong></article><article><span>Filmes</span><strong>{dashboardMetrics.movies}</strong></article><article><span>Pedidos pagos</span><strong>{dashboardMetrics.paidOrders}</strong></article><article><span>Ingressos ativos</span><strong>{dashboardMetrics.activeTickets}</strong></article><article className="revenue-metric"><span>Receita confirmada</span><strong>{currencyFormatter.format(Number(dashboardMetrics.revenue))}</strong></article></div>}</section></div>}
    <nav className="bottom-nav" aria-label="Navegação principal"><a className="active" href="#inicio"><Icon name="play" /><span>Descobrir</span></a><button type="button" onClick={() => void openTickets()}><Icon name="ticket" /><span>Ingressos</span></button><button type="button" onClick={() => void openFavorites()}><Icon name="heart" /><span>Favoritos</span></button><button type="button" onClick={() => void openProfile()}><Icon name="user" /><span>Perfil</span></button></nav><p className="sr-only" role="status" aria-live="polite">{notice}</p>
  </main>
}

export default App
