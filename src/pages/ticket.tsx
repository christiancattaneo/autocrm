import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Ticket, TicketResponse } from '../types/ticket'
import { AttachmentList } from '../components/AttachmentList'
import { ResponseGenerator } from '../components/ResponseGenerator'
import { SendEmailModal } from '../components/SendEmailModal'
import { ResponseThread } from '../components/ResponseThread'
import type { CustomerHistory } from '../lib/api'

export function TicketPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTicket, setEditedTicket] = useState<Ticket | null>(null)
  const { id } = useParams()
  const { user, isStaffOrAdmin } = useAuth()
  const navigate = useNavigate()
  const [responses, setResponses] = useState<TicketResponse[]>([])

  // Add new state for customer history
  const [customerHistory, setCustomerHistory] = useState<CustomerHistory[]>([])
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)

  const fetchResponses = useCallback(async () => {
    if (!id) return
    try {
      const { data, error } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error fetching responses:', error)
    }
  }, [id])

  // Extract fetchTicket function from useEffect
  const fetchTicket = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setTicket(data)
      setEditedTicket(data)

      // Fetch customer history
      const { data: historyData, error: historyError } = await supabase
        .from('tickets')
        .select('title, status')
        .eq('customer_email', data.customer_email)
        .neq('id', id)
        .order('created_at', { ascending: false })

      if (historyError) throw historyError
      setCustomerHistory(historyData)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      navigate('/tickets')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    fetchTicket()
    fetchResponses()
  }, [fetchTicket, fetchResponses])

  const handleSave = async () => {
    if (!editedTicket) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editedTicket.title,
        })
        .eq('id', id)

      if (error) throw error

      setTicket(editedTicket)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating ticket:', error)
      alert('Error updating ticket')
    }
  }

  // Add handler for generated responses
  const handleResponseGenerated = async (response: string) => {
    if (!user || !ticket) return

    try {
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticket.id,
          content: response,
          author_id: user.id,
          author_email: user.email,
          response_type: 'ai_generated'
        })

      if (error) throw error
      fetchResponses()
    } catch (error) {
      console.error('Error saving AI response:', error)
      alert('Error saving AI response')
    }
  }

  const handleSendEmail = () => {
    setIsEmailModalOpen(true)
  }

  const handleEmailSent = () => {
    // Refresh ticket data after email is sent
    fetchTicket()
    fetchResponses()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold">Ticket not found</h2>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          {isEditing ? (
            <input
              type="text"
              value={editedTicket?.title}
              onChange={(e) => setEditedTicket(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="input input-lg input-bordered w-full max-w-xl text-black"
            />
          ) : (
            <h1 className="text-2xl font-bold text-black">{ticket.title}</h1>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className={`badge ${
              ticket.status === 'open' ? 'badge-error' :
              ticket.status === 'in_progress' ? 'badge-warning' :
              'badge-success'
            } text-black`}>
              {ticket.status}
            </div>
            <div className={`badge ${
              ticket.priority === 'urgent' ? 'badge-error' :
              ticket.priority === 'high' ? 'badge-warning' :
              ticket.priority === 'medium' ? 'badge-info' :
              'badge-ghost'
            } text-black`}>
              {ticket.priority}
            </div>
            <div className="text-sm text-black">
              Created {new Date(ticket.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {ticket.customer_email === user?.email && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  className="btn btn-ghost text-black"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedTicket(ticket)
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary text-black"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                className="btn btn-ghost text-black"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Show ResponseGenerator for staff/admin users */}
          {isStaffOrAdmin && (
            <div className="bg-base-100 rounded-box shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <ResponseGenerator
                  ticket={ticket}
                  customerHistory={customerHistory}
                  onResponseGenerated={handleResponseGenerated}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleSendEmail}
                >
                  Send Email
                </button>
              </div>
            </div>
          )}

          {/* Response Thread */}
          <div className="bg-base-100 rounded-box shadow">
            <div className="p-4 border-b border-base-300">
              <h2 className="font-bold text-black">Conversation</h2>
            </div>
            <div className="p-4">
              <ResponseThread
                ticketId={ticket.id}
                responses={responses}
                onResponseAdded={fetchResponses}
              />
            </div>
          </div>

          {ticket.attachments?.length > 0 && (
            <div className="bg-base-100 rounded-box shadow">
              <div className="p-4 border-b border-base-300">
                <h2 className="font-bold text-black">Attachments</h2>
              </div>
              <div className="p-4 text-black">
                <AttachmentList attachments={ticket.attachments} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-base-100 rounded-box shadow p-4">
            <h3 className="font-bold mb-2 text-black">Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-black">Status</dt>
                <dd className="font-medium text-black">{ticket.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-black">Priority</dt>
                <dd className="font-medium text-black">{ticket.priority}</dd>
              </div>
              <div>
                <dt className="text-sm text-black">Created</dt>
                <dd className="font-medium text-black">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </dd>
              </div>
              {ticket.resolved_at && (
                <div>
                  <dt className="text-sm text-black">Resolved</dt>
                  <dd className="font-medium text-black">
                    {new Date(ticket.resolved_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {ticket.tags?.length > 0 && (
            <div className="bg-base-100 rounded-box shadow p-4">
              <h3 className="font-bold mb-2 text-black">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map(tag => (
                  <div key={tag} className="badge badge-outline text-black">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {ticket && (
        <SendEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          ticketId={ticket.id.toString()}
          customerEmail={ticket.customer_email}
          content={editedTicket?.description || ''}
          onSuccess={handleEmailSent}
        />
      )}
    </div>
  )
} 