import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Ticket, TicketStatus, TicketPriority, TicketAttachment } from '../types/ticket'
import { RichTextEditor } from './RichTextEditor'
import { FileUpload } from './FileUpload'
import { AttachmentList } from './AttachmentList'
import { saveAs } from 'file-saver'

interface TicketListProps {
  refreshKey?: number
}

interface ViewSettings {
  showDescription: boolean
  showTags: boolean
  showInternalNotes: boolean
  showAttachments: boolean
  showRatings: boolean
  showDates: boolean
}

const VIEW_SETTINGS_KEY = 'ticketViewSettings'

const defaultViewSettings: ViewSettings = {
  showDescription: true,
  showTags: true,
  showInternalNotes: true,
  showAttachments: true,
  showRatings: true,
  showDates: true
}

export function TicketList({ refreshKey = 0 }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('')
  const [activeFilters, setActiveFilters] = useState(0)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [viewSettings, setViewSettings] = useState<ViewSettings>(() => {
    const saved = localStorage.getItem(VIEW_SETTINGS_KEY)
    return saved ? JSON.parse(saved) : defaultViewSettings
  })
  const [selectedTickets, setSelectedTickets] = useState<number[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showCustomerHistory, setShowCustomerHistory] = useState<string | null>(null)
  const [customerTickets, setCustomerTickets] = useState<Ticket[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    localStorage.setItem(VIEW_SETTINGS_KEY, JSON.stringify(viewSettings))
  }, [viewSettings])

  const fetchTickets = useCallback(async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter) {
        query = query.eq('status', statusFilter)
      }
      if (priorityFilter) {
        query = query.eq('priority', priorityFilter)
      }

      const { data, error } = await query

      if (error) throw error

      let filteredData = data || []
      
      // Client-side search
      if (searchQuery) {
        const search = searchQuery.toLowerCase()
        filteredData = filteredData.filter(ticket => 
          ticket.title.toLowerCase().includes(search) ||
          ticket.description.toLowerCase().includes(search) ||
          ticket.customer_email.toLowerCase().includes(search) ||
          ticket.tags.some((tag: string) => tag.toLowerCase().includes(search))
        )
      }

      setTickets(filteredData)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, priorityFilter])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets, refreshKey])

  useEffect(() => {
    // Count active filters
    let count = 0
    if (searchQuery) count++
    if (statusFilter) count++
    if (priorityFilter) count++
    setActiveFilters(count)
  }, [searchQuery, statusFilter, priorityFilter])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setStatusFilter('')
    setPriorityFilter('')
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, fetchTickets])

  const handleEdit = async (ticket: Ticket) => {
    setEditingTicket(ticket)
  }

  const handleSave = async (updatedTicket: Ticket) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: updatedTicket.title,
          description: updatedTicket.description,
          status: updatedTicket.status,
          priority: updatedTicket.priority,
          tags: updatedTicket.tags,
          internal_notes: updatedTicket.internal_notes,
          attachments: updatedTicket.attachments,
        })
        .eq('id', updatedTicket.id)

      if (error) throw error

      setEditingTicket(null)
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Error updating ticket')
    }
  }

  const handleCancel = () => {
    setEditingTicket(null)
  }

  const handleExport = useCallback(() => {
    // Create CSV content
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Customer', 'Created', 'Resolved', 'Description', 'Tags']
    const rows = tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.priority,
      ticket.customer_email,
      new Date(ticket.created_at).toLocaleDateString(),
      ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : '',
      ticket.description.replace(/<[^>]*>/g, ''), // Remove HTML tags
      ticket.tags.join(', ')
    ])

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `tickets-${new Date().toISOString().split('T')[0]}.csv`)
  }, [tickets])

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleSelectAll = useCallback(() => {
    setSelectedTickets(prev => 
      prev.length === tickets.length ? [] : tickets.map(t => t.id)
    )
  }, [tickets])

  const handleBulkStatusUpdate = async (status: TicketStatus) => {
    if (!selectedTickets.length) return
    
    setBulkActionLoading(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .in('id', selectedTickets)

      if (error) throw error
      
      fetchTickets()
      setSelectedTickets([])
    } catch (error) {
      console.error('Error updating tickets:', error)
      alert('Error updating tickets')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkPriorityUpdate = async (priority: TicketPriority) => {
    if (!selectedTickets.length) return
    
    setBulkActionLoading(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority })
        .in('id', selectedTickets)

      if (error) throw error
      
      fetchTickets()
      setSelectedTickets([])
    } catch (error) {
      console.error('Error updating tickets:', error)
      alert('Error updating tickets')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const fetchCustomerTickets = useCallback(async (email: string) => {
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomerTickets(data || [])
    } catch (error) {
      console.error('Error fetching customer tickets:', error)
      alert('Error fetching customer history')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case 'f':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            searchInputRef.current?.focus()
          }
          break
        case 'c':
          if (!e.ctrlKey && !e.metaKey) {
            clearFilters()
          }
          break
        case 'a':
          if (!e.ctrlKey && !e.metaKey) {
            handleSelectAll()
          }
          break
        case 'e':
          if (!e.ctrlKey && !e.metaKey) {
            handleExport()
          }
          break
        case '?':
          setShowShortcutHelp(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [clearFilters, handleSelectAll, handleExport])

  if (loading) {
    return <div className="flex justify-center items-center h-96">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  }

  if (showShortcutHelp) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 p-6 rounded-box shadow-lg max-w-md w-full">
          <h3 className="text-lg font-bold text-base-content mb-4">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-base-content">Search</span>
              <kbd className="kbd kbd-sm text-base-content">/</kbd>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-base-content">Clear Filters</span>
              <kbd className="kbd kbd-sm text-base-content">C</kbd>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-base-content">Select All</span>
              <kbd className="kbd kbd-sm text-base-content">A</kbd>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-base-content">Export</span>
              <kbd className="kbd kbd-sm text-base-content">E</kbd>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-base-content">Show This Help</span>
              <kbd className="kbd kbd-sm text-base-content">?</kbd>
            </div>
          </div>
          <div className="mt-6 text-right">
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowShortcutHelp(false)}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showCustomerHistory) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-base-100 p-6 rounded-box shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Customer History</h3>
              <p className="text-base-content/70">{showCustomerHistory}</p>
            </div>
            <button 
              className="btn btn-sm btn-ghost"
              onClick={() => setShowCustomerHistory(null)}
            >
              Close
            </button>
          </div>
          
          {loadingHistory ? (
            <div className="flex justify-center items-center h-48">
              <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="stats shadow w-full">
                <div className="stat">
                  <div className="stat-title">Total Tickets</div>
                  <div className="stat-value">{customerTickets.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Open Tickets</div>
                  <div className="stat-value">{customerTickets.filter(t => t.status === 'open').length}</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Average Rating</div>
                  <div className="stat-value">
                    {customerTickets.some(t => t.rating)
                      ? (customerTickets.reduce((sum, t) => sum + (t.rating || 0), 0) / 
                         customerTickets.filter(t => t.rating).length).toFixed(1)
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerTickets.map(ticket => (
                      <tr key={ticket.id} className="hover">
                        <td>{ticket.title}</td>
                        <td>
                          <div className={`badge ${
                            ticket.status === 'open' ? 'badge-primary' :
                            ticket.status === 'in_progress' ? 'badge-secondary' :
                            'badge-ghost'
                          }`}>
                            {ticket.status}
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${
                            ticket.priority === 'urgent' ? 'badge-error' :
                            ticket.priority === 'high' ? 'badge-warning' :
                            ticket.priority === 'medium' ? 'badge-info' :
                            'badge-ghost'
                          }`}>
                            {ticket.priority}
                          </div>
                        </td>
                        <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                        <td>
                          {ticket.rating ? (
                            <div className="rating rating-sm">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <input
                                  key={star}
                                  type="radio"
                                  className="mask mask-star-2 bg-orange-400"
                                  checked={ticket.rating === star}
                                  disabled
                                />
                              ))}
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-base-content">Support Tickets</h2>
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="badge badge-primary">{selectedTickets.length} selected</div>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm">
                  Set Status {bulkActionLoading && <span className="loading loading-spinner loading-xs ml-2"></span>}
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><button onClick={() => handleBulkStatusUpdate('open')} disabled={bulkActionLoading}>Open</button></li>
                  <li><button onClick={() => handleBulkStatusUpdate('in_progress')} disabled={bulkActionLoading}>In Progress</button></li>
                  <li><button onClick={() => handleBulkStatusUpdate('resolved')} disabled={bulkActionLoading}>Resolved</button></li>
                </ul>
              </div>
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-sm">
                  Set Priority {bulkActionLoading && <span className="loading loading-spinner loading-xs ml-2"></span>}
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><button onClick={() => handleBulkPriorityUpdate('low')} disabled={bulkActionLoading}>Low</button></li>
                  <li><button onClick={() => handleBulkPriorityUpdate('medium')} disabled={bulkActionLoading}>Medium</button></li>
                  <li><button onClick={() => handleBulkPriorityUpdate('high')} disabled={bulkActionLoading}>High</button></li>
                  <li><button onClick={() => handleBulkPriorityUpdate('urgent')} disabled={bulkActionLoading}>Urgent</button></li>
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowShortcutHelp(true)}
            className="btn btn-ghost btn-sm text-base-content"
            title="Keyboard Shortcuts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75v16.5M2.25 12h19.5M6.375 17.25a4.875 4.875 0 004.875-4.875V12m6.375 5.25a4.875 4.875 0 01-4.875-4.875V12m-9 8.25h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v13.5a1.5 1.5 0 001.5 1.5zm12.621-9.44c-1.409 1.41-4.242 1.061-4.242 1.061s-.349-2.833 1.06-4.242a2.25 2.25 0 013.182 0 2.25 2.25 0 010 3.182z" />
            </svg>
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm text-base-content">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              View
            </label>
            <div tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <div className="p-2 space-y-2">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showDescription}
                    onChange={(e) => setViewSettings({ ...viewSettings, showDescription: e.target.checked })}
                  />
                  <span className="label-text">Description</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showTags}
                    onChange={(e) => setViewSettings({ ...viewSettings, showTags: e.target.checked })}
                  />
                  <span className="label-text">Tags</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showInternalNotes}
                    onChange={(e) => setViewSettings({ ...viewSettings, showInternalNotes: e.target.checked })}
                  />
                  <span className="label-text">Internal Notes</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showAttachments}
                    onChange={(e) => setViewSettings({ ...viewSettings, showAttachments: e.target.checked })}
                  />
                  <span className="label-text">Attachments</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showRatings}
                    onChange={(e) => setViewSettings({ ...viewSettings, showRatings: e.target.checked })}
                  />
                  <span className="label-text">Ratings</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={viewSettings.showDates}
                    onChange={(e) => setViewSettings({ ...viewSettings, showDates: e.target.checked })}
                  />
                  <span className="label-text">Dates</span>
                </label>
                <div className="divider my-1"></div>
                <button
                  className="btn btn-sm btn-ghost w-full"
                  onClick={() => setViewSettings(defaultViewSettings)}
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={handleExport}
            className="btn btn-ghost btn-sm text-base-content"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export
          </button>
          {activeFilters > 0 && (
            <button 
              onClick={clearFilters}
              className="btn btn-ghost btn-sm text-base-content"
            >
              Clear filters
            </button>
          )}
          <div className="badge badge-neutral">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="join w-full">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              className="checkbox"
              checked={selectedTickets.length === tickets.length}
              onChange={handleSelectAll}
            />
            <span className="text-base-content">Select All</span>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tickets... (Press '/' to focus)"
            className="input input-bordered join-item flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="btn join-item"
              onClick={() => setSearchQuery('')}
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="join">
            <button
              className={`btn join-item ${!statusFilter ? 'btn-active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              All
            </button>
            <button
              className={`btn join-item ${statusFilter === 'open' ? 'btn-active' : ''}`}
              onClick={() => setStatusFilter('open')}
            >
              Open
            </button>
            <button
              className={`btn join-item ${statusFilter === 'in_progress' ? 'btn-active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
            >
              In Progress
            </button>
            <button
              className={`btn join-item ${statusFilter === 'resolved' ? 'btn-active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
            >
              Resolved
            </button>
          </div>

          <div className="join">
            <button
              className={`btn join-item ${!priorityFilter ? 'btn-active' : ''}`}
              onClick={() => setPriorityFilter('')}
            >
              All
            </button>
            <button
              className={`btn join-item ${priorityFilter === 'low' ? 'btn-active' : ''}`}
              onClick={() => setPriorityFilter('low')}
            >
              Low
            </button>
            <button
              className={`btn join-item ${priorityFilter === 'medium' ? 'btn-active' : ''}`}
              onClick={() => setPriorityFilter('medium')}
            >
              Medium
            </button>
            <button
              className={`btn join-item ${priorityFilter === 'high' ? 'btn-active' : ''}`}
              onClick={() => setPriorityFilter('high')}
            >
              High
            </button>
            <button
              className={`btn join-item ${priorityFilter === 'urgent' ? 'btn-active' : ''}`}
              onClick={() => setPriorityFilter('urgent')}
            >
              Urgent
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              {editingTicket?.id === ticket.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editingTicket.title}
                    onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })}
                    className="input input-bordered w-full"
                  />
                  
                  <RichTextEditor
                    value={editingTicket.description}
                    onChange={(value: string) => setEditingTicket({ ...editingTicket, description: value })}
                  />

                  <select
                    value={editingTicket.status}
                    onChange={(e) => setEditingTicket({ ...editingTicket, status: e.target.value as TicketStatus })}
                    className="select select-bordered w-full"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select
                    value={editingTicket.priority}
                    onChange={(e) => setEditingTicket({ ...editingTicket, priority: e.target.value as TicketPriority })}
                    className="select select-bordered w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Tags</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editingTicket.tags.map((tag) => (
                        <div key={tag} className="badge badge-primary gap-1">
                          {tag}
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setEditingTicket({
                              ...editingTicket,
                              tags: editingTicket.tags.filter(t => t !== tag)
                            })}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Type and press Enter to add tags"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          e.preventDefault()
                          setEditingTicket({
                            ...editingTicket,
                            tags: [...editingTicket.tags, e.currentTarget.value.trim()]
                          })
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Internal Notes</span>
                    </label>
                    <RichTextEditor
                      value={editingTicket.internal_notes || ''}
                      onChange={(value: string) => setEditingTicket({ ...editingTicket, internal_notes: value })}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Attachments</span>
                    </label>
                    <FileUpload
                      onUpload={(newAttachments: TicketAttachment[]) => setEditingTicket({
                        ...editingTicket,
                        attachments: [...editingTicket.attachments, ...newAttachments]
                      })}
                    />
                    <div className="mt-2">
                      <AttachmentList
                        attachments={editingTicket.attachments}
                        onRemove={(attachment: TicketAttachment) => setEditingTicket({
                          ...editingTicket,
                          attachments: editingTicket.attachments.filter(a => a.id !== attachment.id)
                        })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-ghost"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleSave(editingTicket)}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => handleSelectTicket(ticket.id)}
                      />
                      <h3 className="card-title text-base-content flex-1">{ticket.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-sm text-base-content"
                        onClick={() => {
                          setShowCustomerHistory(ticket.customer_email)
                          fetchCustomerTickets(ticket.customer_email)
                        }}
                        title="View customer history"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-base-content"
                        onClick={() => handleEdit(ticket)}
                      >
                        Edit
                      </button>
                      <div className={`badge ${
                        ticket.status === 'open' ? 'badge-primary' :
                        ticket.status === 'in_progress' ? 'badge-secondary' :
                        'badge-ghost'
                      }`}>
                        {ticket.status}
                      </div>
                    </div>
                  </div>
                  
                  {viewSettings.showDescription && (
                    <div 
                      className="prose prose-sm text-base-content/70 mt-2 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: ticket.description }}
                    />
                  )}
                  
                  {viewSettings.showTags && ticket.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {ticket.tags.map((tag) => (
                        <div key={tag} className="badge badge-outline badge-sm">{tag}</div>
                      ))}
                    </div>
                  )}

                  {viewSettings.showInternalNotes && ticket.internal_notes && (
                    <div className="mt-3 p-2 bg-base-200 rounded-lg">
                      <p className="text-xs font-medium text-base-content/50 mb-1">Internal Notes</p>
                      <div 
                        className="prose prose-sm"
                        dangerouslySetInnerHTML={{ __html: ticket.internal_notes }}
                      />
                    </div>
                  )}

                  {viewSettings.showRatings && ticket.status === 'resolved' && !ticket.rating && (
                    <div className="mt-3 p-2 bg-base-200 rounded-lg">
                      <p className="text-xs font-medium text-base-content/50 mb-1">Rate Your Experience</p>
                      <div className="rating rating-md mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <input
                            key={star}
                            type="radio"
                            name={`rating-${ticket.id}`}
                            className="mask mask-star-2 bg-orange-400"
                            onClick={async () => {
                              const comment = prompt('Would you like to share any feedback about your experience?')
                              try {
                                const { error } = await supabase
                                  .from('tickets')
                                  .update({
                                    rating: star,
                                    rating_comment: comment,
                                    rated_at: new Date().toISOString()
                                  })
                                  .eq('id', ticket.id)
                                
                                if (error) throw error
                                fetchTickets()
                              } catch (error) {
                                console.error('Error submitting rating:', error)
                                alert('Error submitting rating')
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {viewSettings.showRatings && ticket.rating && (
                    <div className="mt-3 p-2 bg-base-200 rounded-lg">
                      <p className="text-xs font-medium text-base-content/50 mb-1">Customer Rating</p>
                      <div className="rating rating-md mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <input
                            key={star}
                            type="radio"
                            name={`rating-${ticket.id}`}
                            className="mask mask-star-2 bg-orange-400"
                            checked={ticket.rating === star}
                            disabled
                          />
                        ))}
                      </div>
                      {ticket.rating_comment && (
                        <div className="mt-2 text-sm text-base-content/70 italic">
                          "{ticket.rating_comment}"
                        </div>
                      )}
                      <div className="text-xs text-base-content/50 mt-1">
                        Rated on {new Date(ticket.rated_at!).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {viewSettings.showAttachments && ticket.attachments?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-base-content/50 mb-1">Attachments</p>
                      <div className="flex flex-wrap gap-2">
                        {ticket.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm p-1 hover:bg-base-200 rounded"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                            </svg>
                            {attachment.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 items-center mt-4">
                    <div className={`badge ${
                      ticket.priority === 'urgent' ? 'badge-error' :
                      ticket.priority === 'high' ? 'badge-warning' :
                      ticket.priority === 'medium' ? 'badge-info' :
                      'badge-ghost'
                    }`}>
                      {ticket.priority}
                    </div>
                    {viewSettings.showDates && (
                      <div className="text-xs text-base-content/50 ml-auto">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {tickets.length === 0 && (
        <div className="text-center py-16 bg-base-100 rounded-box shadow-sm">
          <h3 className="text-lg font-semibold">No tickets yet</h3>
          <p className="text-base-content/70 mt-1">Create a new ticket to get started</p>
        </div>
      )}
    </div>
  )
} 