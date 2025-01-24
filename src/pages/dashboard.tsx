import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Ticket } from '../types/ticket'

interface TicketStats {
  total: number
  open: number
  inProgress: number
  resolved: number
}

export function DashboardPage() {
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  })
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { user, role, isStaffOrAdmin } = useAuth()

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        let query = supabase
          .from('tickets')
          .select('*')
        
        // Filter by customer email for customers
        if (role === 'customer') {
          query = query.eq('customer_email', user?.email)
        }

        // Fetch tickets for stats
        const { data: tickets, error: statsError } = await query
        if (statsError) throw statsError

        const stats = tickets.reduce((acc, ticket) => {
          acc.total++
          switch (ticket.status) {
            case 'open':
              acc.open++
              break
            case 'in_progress':
              acc.inProgress++
              break
            case 'resolved':
              acc.resolved++
              break
          }
          return acc
        }, { total: 0, open: 0, inProgress: 0, resolved: 0 })

        setStats(stats)

        // Fetch recent tickets
        const { data: recent, error: recentError } = await query
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentError) throw recentError
        setRecentTickets(recent)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user?.email, role])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            {role === 'admin' ? 'Admin Dashboard' : 
             role === 'staff' ? 'Staff Dashboard' : 
             'Customer Dashboard'}
          </h1>
          <p className="text-base-content/70 mt-1">
            {isStaffOrAdmin 
              ? 'Monitor and manage support tickets'
              : 'Track and manage your support requests'}
          </p>
        </div>
        {role === 'customer' && (
          <Link to="/new" className="btn btn-primary">
            New Ticket
          </Link>
        )}
      </div>

      {/* Quick Actions for Staff */}
      {isStaffOrAdmin && (
        <div className="flex gap-4">
          <Link to="/tickets" className="btn btn-outline flex-1">
            View All Tickets
          </Link>
          <Link to="/performance" className="btn btn-outline flex-1">
            View Performance
          </Link>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">Total Tickets</div>
          <div className="stat-value text-base-content">{stats.total}</div>
          {isStaffOrAdmin && (
            <div className="stat-desc text-base-content/60">All time tickets</div>
          )}
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">Open</div>
          <div className="stat-value text-error">{stats.open}</div>
          <div className="stat-desc text-base-content/60">Needs attention</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">In Progress</div>
          <div className="stat-value text-warning">{stats.inProgress}</div>
          <div className="stat-desc text-base-content/60">Being worked on</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">Resolved</div>
          <div className="stat-value text-success">{stats.resolved}</div>
          <div className="stat-desc text-base-content/60">Successfully completed</div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div>
        <h2 className="text-xl font-bold text-base-content mb-4">Recent Tickets</h2>
        {recentTickets.length > 0 ? (
          <div className="bg-base-100 rounded-box shadow divide-y divide-base-300">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/tickets/${ticket.id}`}
                className="block p-4 hover:bg-base-200 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-base-content">
                      {ticket.title}
                    </h3>
                    <p className="text-base-content/70 text-sm mt-1">
                      {ticket.description.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      ticket.status === 'open' ? 'badge-error' :
                      ticket.status === 'in_progress' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {isStaffOrAdmin && (
                      <span className="text-sm text-base-content/60">
                        {ticket.customer_email}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-base-100 rounded-box shadow p-8 text-center">
            <h3 className="font-medium text-base-content mb-2">No tickets yet</h3>
            <p className="text-base-content/70">
              {role === 'customer' 
                ? 'Create your first support ticket to get started'
                : 'No tickets have been submitted yet'}
            </p>
            {role === 'customer' && (
              <Link to="/new" className="btn btn-primary mt-4">
                Create Ticket
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 