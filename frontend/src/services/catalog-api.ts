export type ApiMovie = {
  id: number
  title: string
  description: string | null
  duration: number
  classification: 'L' | 'AGE_10' | 'AGE_12' | 'AGE_14' | 'AGE_16' | 'AGE_18'
  coverUrl: string | null
  trailerUrl: string | null
}

export type ApiCinema = {
  id: number
  name: string
  address: string
  city: string
  state: string
}

export type ApiSession = {
  id: number
  movieId: number
  roomId: number
  startsAt: string
  endsAt: string
  price: string
  room: {
    id: number
    number: number
    type: 'STANDARD' | 'VIP'
    cinemaId: number
  }
  movie?: { title: string }
}

export type ApiRoom = {
  id: number
  number: number
  type: 'STANDARD' | 'VIP'
  cinemaId: number
}

export type ApiSeat = {
  id: number
  row: string
  number: number
  type: 'STANDARD' | 'VIP' | 'ACCESSIBLE'
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'UNAVAILABLE'
}

export type ApiRoomSeat = {
  id: number
  row: string
  number: number
  type: ApiSeat['type']
  isAvailable: boolean
}

export type TicketType = 'FULL' | 'HALF'

export type ApiTicket = {
  id: number
  orderId: number
  code: string
  type: TicketType
  price: string
  status: 'ACTIVE' | 'USED' | 'CANCELLED'
  seat: { row: string; number: number }
  session: {
    startsAt: string
    movie: { title: string }
    room: { number: number; cinema: { name: string; city: string } }
  }
}

export type CinemaTicketSale = {
  id: number
  code: string
  status: ApiTicket['status']
  type: TicketType
  price: string
  seat: { row: string; number: number }
  buyer: { name: string; email: string }
  session: { startsAt: string; movie: { title: string }; room: { number: number } }
}

export type CinemaSalesMetrics = {
  ticketsSold: number
  activeTickets: number
  revenue: string
  occupancy: number
  upcomingSessions: number
}

export type ApiFavorite = {
  movieId: number
  movie: ApiMovie
}

export type DashboardMetrics = {
  cinemas: number
  movies: number
  paidOrders: number
  activeTickets: number
  revenue: string
}

export type AuthUser = {
  id: number
  name: string
  email: string
  phone?: string | null
  role: 'CUSTOMER' | 'CINEMA_ADMIN' | 'PLATFORM_ADMIN'
  createdAt: string
}

export type AdminUser = AuthUser

export type CreateMovieInput = {
  title: string
  description?: string
  duration: number
  classification: ApiMovie['classification']
  coverUrl?: string
  trailerUrl?: string
}

export type CreateCinemaInput = {
  name: string
  address: string
  city: string
  state: string
}

type AuthResponse = {
  token: string
  user: AuthUser
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? '/api'

export async function fetchMovies(): Promise<ApiMovie[]> {
  const response = await fetch(`${apiBaseUrl}/movies`)

  if (!response.ok) {
    throw new Error('Não foi possível carregar a programação.')
  }

  return response.json() as Promise<ApiMovie[]>
}

async function fetchCatalogResource<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`)

  if (!response.ok) throw new Error('Não foi possível carregar a programação.')

  return response.json() as Promise<T>
}

async function fetchAuthenticatedResource<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const responseBody = await response.json().catch(() => null) as { message?: string } | null

  if (!response.ok) throw new Error(responseBody?.message ?? 'Não foi possível carregar seus ingressos.')

  return responseBody as T
}

export function fetchCinemas() {
  return fetchCatalogResource<ApiCinema[]>('/cinemas')
}

export function fetchManageableCinemas(token: string) {
  return fetchAuthenticatedResource<ApiCinema[]>('/admin/cinemas', token)
}

export function fetchCinemaTicketSales(token: string, cinemaId: number) {
  return fetchAuthenticatedResource<CinemaTicketSale[]>(`/admin/cinemas/${cinemaId}/tickets`, token)
}

export function fetchCinemaSalesMetrics(token: string, cinemaId: number) {
  return fetchAuthenticatedResource<CinemaSalesMetrics>(`/admin/cinemas/${cinemaId}/metrics`, token)
}

export function fetchSessions() {
  return fetchCatalogResource<ApiSession[]>('/sessions')
}

export function fetchRooms() {
  return fetchCatalogResource<ApiRoom[]>('/rooms')
}

export function fetchSessionSeats(sessionId: number) {
  return fetchCatalogResource<ApiSeat[]>(`/sessions/${sessionId}/seats`)
}

export function fetchRoomSeats(roomId: number) {
  return fetchCatalogResource<ApiRoomSeat[]>(`/rooms/${roomId}/seats`)
}

async function postCatalogResource<T>(path: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const responseBody = await response.json().catch(() => null) as { message?: string } | null

  if (!response.ok) throw new Error(responseBody?.message ?? 'Não foi possível concluir a solicitação.')

  return responseBody as T
}

export function loginCustomer(email: string, password: string) {
  return postCatalogResource<AuthResponse>('/auth/login', { email, password })
}

export function registerCustomer(name: string, email: string, phone: string, password: string) {
  return postCatalogResource<{ id: number }>('/users', { name, email, phone, password })
}

export function createOrder(token: string, sessionId: number, tickets: Array<{ seatId: number; type: TicketType }>) {
  return postCatalogResource<{ id: number; total: string; expiresAt: string }>('/orders', {
    sessionId,
    tickets,
  }, token)
}

export function payOrder(token: string, orderId: number) {
  return postCatalogResource<{ order: { id: number; status: 'PAID' }; tickets: Array<{ code: string }> }>(`/orders/${orderId}/pay`, {}, token)
}

export function fetchTickets(token: string) {
  return fetchAuthenticatedResource<ApiTicket[]>('/tickets', token)
}

export function fetchTicketQrCode(token: string, code: string) {
  return fetchAuthenticatedResource<{ qrCodeDataUrl: string }>(`/tickets/${encodeURIComponent(code)}/qrcode`, token)
}

export function validateTicket(token: string, code: string) {
  return postCatalogResource<{ status: 'ACTIVE' | 'USED' | 'CANCELLED'; usedAt: string | null }>('/tickets/validate', { code }, token)
}

export function fetchCurrentUser(token: string) {
  return fetchAuthenticatedResource<AuthUser>('/auth/me', token)
}

export function cancelOrder(token: string, orderId: number) {
  return postCatalogResource<{ id: number; status: 'CANCELLED' }>(`/orders/${orderId}/cancel`, {}, token)
}

export function fetchFavorites(token: string) {
  return fetchAuthenticatedResource<ApiFavorite[]>('/favorites', token)
}

export function addFavorite(token: string, movieId: number) {
  return postCatalogResource<ApiFavorite>(`/favorites/${movieId}`, {}, token)
}

export async function removeFavorite(token: string, movieId: number) {
  const response = await fetch(`${apiBaseUrl}/favorites/${movieId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(body?.message ?? 'Não foi possível remover o favorito.')
  }
}

export function fetchDashboard(token: string) {
  return fetchAuthenticatedResource<DashboardMetrics>('/admin/dashboard', token)
}

export function createMovie(token: string, data: CreateMovieInput) {
  return postCatalogResource<ApiMovie>('/movies', data, token)
}

export function createCinema(token: string, data: CreateCinemaInput) {
  return postCatalogResource<ApiCinema>('/cinemas', data, token)
}

export function createRoom(token: string, data: { cinemaId: number; number: number; type: ApiRoom['type'] }) {
  return postCatalogResource<ApiRoom>('/rooms', data, token)
}

export function generateSeats(token: string, roomId: number, data: { rows: number; seatsPerRow: number; accessibleSeats: string[]; vipSeats: string[] }) {
  return postCatalogResource<ApiSeat[]>(`/rooms/${roomId}/seats`, data, token)
}

export async function updateSeatAvailability(token: string, roomId: number, seatId: number, isAvailable: boolean) {
  const response = await fetch(`${apiBaseUrl}/rooms/${roomId}/seats/${seatId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ isAvailable }),
  })
  const body = await response.json().catch(() => null) as { message?: string } | ApiRoomSeat | null
  if (!response.ok) throw new Error((body as { message?: string } | null)?.message ?? 'Não foi possível atualizar o assento.')
  return body as ApiRoomSeat
}

export function createSession(token: string, data: { movieId: number; roomId: number; startsAt: string; price: number; recurrenceDays?: number[]; recurrenceUntil?: string }) {
  return postCatalogResource<{ sessions: ApiSession[] }>('/sessions', data, token)
}

export function fetchUsers(token: string) {
  return fetchAuthenticatedResource<AdminUser[]>('/users', token)
}

export async function updateUserRole(token: string, userId: number, role: AdminUser['role']) {
  const response = await fetch(`${apiBaseUrl}/users/${userId}/role`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ role }) })
  const body = await response.json().catch(() => null) as { message?: string } | AdminUser | null
  if (!response.ok) throw new Error((body as { message?: string } | null)?.message ?? 'Não foi possível atualizar o papel.')
  return body as AdminUser
}

export function assignCinemaAdmin(token: string, cinemaId: number, userId: number) {
  return postCatalogResource<{ cinemaId: number; userId: number }>(`/cinemas/${cinemaId}/admins`, { userId }, token)
}
