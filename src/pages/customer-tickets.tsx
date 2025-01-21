import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Ticket } from '../types/ticket'

export function CustomerTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user } = useAuth()

  useEffect(() => {
    async function fetchTickets() {
      try {
        let query = supabase
          .from('tickets')
          .select('*')
          .eq('customer_email', user?.email)
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (searchQuery) {
          query = query.ilike('title', `%${searchQuery}%`)
        }

        const { data, error } = await query

        if (error) throw error
        setTickets(data || [])
      } catch (error) {
        console.error('Error fetching tickets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [user?.email, searchQuery, statusFilter])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-base-content">My Tickets</h1>
        <Link to="/new" className="btn btn-primary">
          New Ticket
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select select-bordered"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : tickets.length > 0 ? (
        <div className="grid gap-4">
          {tickets.map(ticket => (
            <Link
              key={ticket.id}
              to={`/tickets/${ticket.id}`}
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="card-title text-base-content">{ticket.title}</h2>
                    <p className="text-base-content/80 mt-1 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: ticket.description }}
                    />
                    <div className="flex items-center gap-2 mt-4">
                      <div className={`badge ${
                        ticket.status === 'open' ? 'badge-error' :
                        ticket.status === 'in_progress' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {ticket.status}
                      </div>
                      {ticket.priority && (
                        <div className={`badge ${
                          ticket.priority === 'urgent' ? 'badge-error' :
                          ticket.priority === 'high' ? 'badge-warning' :
                          ticket.priority === 'medium' ? 'badge-info' :
                          'badge-ghost'
                        }`}>
                          {ticket.priority}
                        </div>
                      )}
                      {ticket.attachments?.length > 0 && (
                        <div className="badge badge-ghost gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                          </svg>
                          {ticket.attachments.length}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-base-content/70">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-bold mb-2">No tickets found</h2>
          <p className="text-base-content/70 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? "Try adjusting your search or filters"
              : "You haven't created any tickets yet"}
          </p>
          <Link to="/new" className="btn btn-primary">
            Create your first ticket
          </Link>
        </div>
      )}
    </div>
  )
} 