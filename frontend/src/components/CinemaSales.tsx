import { useEffect, useState } from 'react'

import { fetchCinemaSalesMetrics, fetchCinemaTicketSales, fetchManageableCinemas, type ApiCinema, type CinemaSalesMetrics, type CinemaTicketSale } from '../services/catalog-api'

type CinemaSalesProps = { token: string }

export function CinemaSales({ token }: CinemaSalesProps) {
  const [cinemas, setCinemas] = useState<ApiCinema[]>([])
  const [cinemaId, setCinemaId] = useState('')
  const [sales, setSales] = useState<CinemaTicketSale[]>([])
  const [metrics, setMetrics] = useState<CinemaSalesMetrics | null>(null)
  const [message, setMessage] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CinemaTicketSale['status']>('ALL')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true
    fetchManageableCinemas(token)
      .then((items) => {
        if (!active) return
        setCinemas(items)
        if (items.length === 1) setCinemaId(String(items[0].id))
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar os cinemas administrados.') })
    return () => { active = false }
  }, [token])

  useEffect(() => {
    if (!cinemaId) return
    let active = true
    // oxlint-disable-next-line react/set-state-in-effect -- inicia o estado visual de uma consulta externa.
    setMessage('Carregando vendas...')
    Promise.all([fetchCinemaTicketSales(token, Number(cinemaId)), fetchCinemaSalesMetrics(token, Number(cinemaId))])
      .then(([items, cinemaMetrics]) => { if (active) { setSales(items); setMetrics(cinemaMetrics); setMessage('') } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as vendas.') })
    return () => { active = false }
  }, [cinemaId, token])

  const filteredSales = statusFilter === 'ALL' ? sales : sales.filter((sale) => sale.status === statusFilter)
  const itemsPerPage = 10
  const pageCount = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage))
  const visibleSales = filteredSales.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return <section className="admin-sales">
    <div className="admin-sales-heading"><div><p className="eyebrow">Bilheteria</p><h3>Ingressos vendidos</h3></div><label>Cinema<select value={cinemaId} onChange={(event) => { setCinemaId(event.target.value); setPage(1) }}><option value="">Selecione</option>{cinemas.map((cinema) => <option key={cinema.id} value={cinema.id}>{cinema.name}</option>)}</select></label></div>
    {message ? <p className="empty-state">{message}</p> : cinemaId && <>{metrics && <dl className="cinema-metrics"><div><dt>Receita</dt><dd>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(metrics.revenue))}</dd></div><div><dt>Ingressos</dt><dd>{metrics.ticketsSold}</dd></div><div><dt>Ocupação</dt><dd>{metrics.occupancy}%</dd></div><div><dt>Próximas sessões</dt><dd>{metrics.upcomingSessions}</dd></div></dl>}{sales.length ? <><label className="sales-filter">Status<select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1) }}><option value="ALL">Todos</option><option value="ACTIVE">Ativos</option><option value="USED">Utilizados</option><option value="CANCELLED">Cancelados</option></select></label><div className="admin-sales-list">{visibleSales.map((sale) => <article key={sale.id}><div><strong>{sale.session.movie.title}</strong><span>{sale.buyer.name} · {sale.buyer.email}</span></div><div><span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sale.session.startsAt))}</span><span>Sala {sale.session.room.number} · Assento {sale.seat.row}{sale.seat.number}</span></div><b className={`sale-status ${sale.status.toLowerCase()}`}>{sale.status === 'ACTIVE' ? 'Ativo' : sale.status === 'USED' ? 'Utilizado' : 'Cancelado'}</b></article>)}</div>{pageCount > 1 && <div className="sales-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span>Página {page} de {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Próxima</button></div>}</> : <p className="empty-state">Ainda não há ingressos vendidos para este cinema.</p>}</>}</section>
}
