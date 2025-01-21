import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface PerformanceMetrics {
  totalTickets: number
  avgResolutionTime: number
  statusDistribution: {
    open: number
    in_progress: number
    resolved: number
  }
  priorityDistribution: {
    urgent: number
    high: number
    medium: number
    low: number
  }
  ticketAgeDistribution: {
    lessThanDay: number
    lessThanWeek: number
    lessThanMonth: number
    overMonth: number
  }
}

export function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalTickets: 0,
    avgResolutionTime: 0,
    statusDistribution: { open: 0, in_progress: 0, resolved: 0 },
    priorityDistribution: { urgent: 0, high: 0, medium: 0, low: 0 },
    ticketAgeDistribution: {
      lessThanDay: 0,
      lessThanWeek: 0,
      lessThanMonth: 0,
      overMonth: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        // Fetch all tickets
        const { data: tickets, error } = await supabase
          .from('tickets')
          .select('*')

        if (error) throw error

        // Calculate metrics
        const now = new Date()
        const metrics: PerformanceMetrics = {
          totalTickets: tickets.length,
          avgResolutionTime: 0,
          statusDistribution: { open: 0, in_progress: 0, resolved: 0 },
          priorityDistribution: { urgent: 0, high: 0, medium: 0, low: 0 },
          ticketAgeDistribution: {
            lessThanDay: 0,
            lessThanWeek: 0,
            lessThanMonth: 0,
            overMonth: 0
          }
        }

        let totalResolutionTime = 0
        let resolvedCount = 0

        tickets.forEach(ticket => {
          // Status distribution
          metrics.statusDistribution[ticket.status as keyof typeof metrics.statusDistribution]++

          // Priority distribution
          if (ticket.priority) {
            metrics.priorityDistribution[ticket.priority as keyof typeof metrics.priorityDistribution]++
          }

          // Resolution time
          if (ticket.resolved_at) {
            const resolutionTime = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime()
            totalResolutionTime += resolutionTime
            resolvedCount++
          }

          // Ticket age
          const age = now.getTime() - new Date(ticket.created_at).getTime()
          const dayInMs = 24 * 60 * 60 * 1000

          if (age < dayInMs) {
            metrics.ticketAgeDistribution.lessThanDay++
          } else if (age < 7 * dayInMs) {
            metrics.ticketAgeDistribution.lessThanWeek++
          } else if (age < 30 * dayInMs) {
            metrics.ticketAgeDistribution.lessThanMonth++
          } else {
            metrics.ticketAgeDistribution.overMonth++
          }
        })

        // Calculate average resolution time in days
        metrics.avgResolutionTime = resolvedCount > 0
          ? totalResolutionTime / resolvedCount / (24 * 60 * 60 * 1000)
          : 0

        setMetrics(metrics)
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-base-content">Performance Metrics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">Total Tickets</div>
          <div className="stat-value text-base-content">{metrics.totalTickets}</div>
        </div>
        <div className="stat bg-base-100 rounded-box shadow">
          <div className="stat-title text-base-content/70">Avg. Resolution Time</div>
          <div className="stat-value text-base-content">
            {metrics.avgResolutionTime.toFixed(1)} days
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base-content">Status Distribution</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="badge badge-error">Open</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-error"
                    style={{
                      width: `${(metrics.statusDistribution.open / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.statusDistribution.open}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-warning">In Progress</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(metrics.statusDistribution.in_progress / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.statusDistribution.in_progress}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-success">Resolved</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${(metrics.statusDistribution.resolved / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.statusDistribution.resolved}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base-content">Priority Distribution</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="badge badge-error">Urgent</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-error"
                    style={{
                      width: `${(metrics.priorityDistribution.urgent / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.priorityDistribution.urgent}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-warning">High</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(metrics.priorityDistribution.high / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.priorityDistribution.high}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-info">Medium</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info"
                    style={{
                      width: `${(metrics.priorityDistribution.medium / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.priorityDistribution.medium}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-ghost">Low</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral"
                    style={{
                      width: `${(metrics.priorityDistribution.low / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.priorityDistribution.low}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Age Distribution */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ticket Age</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="badge badge-success">&lt; 1 day</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success"
                    style={{
                      width: `${(metrics.ticketAgeDistribution.lessThanDay / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.ticketAgeDistribution.lessThanDay}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-info">&lt; 1 week</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-info"
                    style={{
                      width: `${(metrics.ticketAgeDistribution.lessThanWeek / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.ticketAgeDistribution.lessThanWeek}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-warning">&lt; 1 month</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning"
                    style={{
                      width: `${(metrics.ticketAgeDistribution.lessThanMonth / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.ticketAgeDistribution.lessThanMonth}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="badge badge-error">&gt; 1 month</div>
                <div className="flex-1 h-3 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-error"
                    style={{
                      width: `${(metrics.ticketAgeDistribution.overMonth / metrics.totalTickets) * 100}%`
                    }}
                  />
                </div>
                <div className="text-sm font-medium text-base-content">
                  {metrics.ticketAgeDistribution.overMonth}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}