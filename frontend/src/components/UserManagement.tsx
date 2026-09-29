import { useEffect, useMemo, useState } from 'react'
import { assignCinemaAdmin, fetchCinemas, fetchUsers, updateUserRole, type AdminUser, type ApiCinema } from '../services/catalog-api'

export function UserManagement({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([fetchUsers(token), fetchCinemas()])
      .then(([userItems, cinemaItems]) => {
        if (!active) return
        setUsers(userItems)
        setCinemas(cinemaItems)
      })
      .catch(() => { if (active) setFeedback('Não foi possível carregar os usuários.') })

    return () => { active = false }
  }, [token])
  const visibleUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query])
  const changeRole = async (user: AdminUser, role: AdminUser['role']) => {
    setIsSaving(user.id); setFeedback('')
    try { const updated = await updateUserRole(token, user.id, role); setUsers((items) => items.map((item) => item.id === user.id ? updated : item)); setFeedback('Papel atualizado.') } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o papel.') } finally { setIsSaving(null) }
  }
  const linkCinema = async (user: AdminUser, cinemaId: number) => {
    if (!cinemaId) return
    setIsSaving(user.id); setFeedback('')
    try { await assignCinemaAdmin(token, cinemaId, user.id); setFeedback('Administrador vinculado ao cinema.') } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível vincular o administrador.') } finally { setIsSaving(null) }
  }

  return <section className="admin-users"><div className="admin-users-header"><div><p className="eyebrow">Acessos</p><h3>Usuários da plataforma</h3></div><label className="admin-search">Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou e-mail" /></label></div><div className="admin-user-list">{visibleUsers.map((user) => <article key={user.id}><div><strong>{user.name}</strong><span>{user.email}{user.phone ? ` · ${user.phone}` : ''}</span></div><label>Papel<select value={user.role} disabled={isSaving === user.id} onChange={(event) => void changeRole(user, event.target.value as AdminUser['role'])}><option value="CUSTOMER">Cliente</option><option value="CINEMA_ADMIN">Admin. cinema</option><option value="PLATFORM_ADMIN">Admin. plataforma</option></select></label>{user.role === 'CINEMA_ADMIN' && <label>Cinema<select defaultValue="" disabled={isSaving === user.id} onChange={(event) => void linkCinema(user, Number(event.target.value))}><option value="">Vincular cinema</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select></label>}</article>)}</div>{feedback && <p className="reservation-message" role="status">{feedback}</p>}</section>
}
