import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Ticket } from '../types/ticket'
import { RichTextEditor } from '../components/RichTextEditor'
import { AttachmentList } from '../components/AttachmentList'

export function TicketPage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTicket, setEditedTicket] = useState<Ticket | null>(null)
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchTicket() {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        setTicket(data)
        setEditedTicket(data)
      } catch (error) {
        console.error('Error fetching ticket:', error)
        navigate('/tickets')
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id, navigate])

  const handleSave = async () => {
    if (!editedTicket) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          title: editedTicket.title,
          description: editedTicket.description,
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
              className="input input-lg input-bordered w-full max-w-xl"
            />
          ) : (
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
          )}
          <div className="flex items-center gap-4 mt-2">
            <div className={`badge ${
              ticket.status === 'open' ? 'badge-error' :
              ticket.status === 'in_progress' ? 'badge-warning' :
              'badge-success'
            }`}>
              {ticket.status}
            </div>
            <div className={`badge ${
              ticket.priority === 'urgent' ? 'badge-error' :
              ticket.priority === 'high' ? 'badge-warning' :
              ticket.priority === 'medium' ? 'badge-info' :
              'badge-ghost'
            }`}>
              {ticket.priority}
            </div>
            <div className="text-sm text-base-content/70">
              Created {new Date(ticket.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {ticket.customer_email === user?.email && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsEditing(false)
                    setEditedTicket(ticket)
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                className="btn btn-ghost"
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
          <div className="bg-base-100 rounded-box shadow">
            <div className="p-4 border-b border-base-300">
              <h2 className="font-bold">Description</h2>
            </div>
            <div className="p-4">
              {isEditing ? (
                <RichTextEditor
                  value={editedTicket?.description || ''}
                  onChange={(value) => setEditedTicket(prev => prev ? { ...prev, description: value } : null)}
                />
              ) : (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                />
              )}
            </div>
          </div>

          {ticket.attachments?.length > 0 && (
            <div className="bg-base-100 rounded-box shadow">
              <div className="p-4 border-b border-base-300">
                <h2 className="font-bold">Attachments</h2>
              </div>
              <div className="p-4">
                <AttachmentList attachments={ticket.attachments} />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-base-100 rounded-box shadow p-4">
            <h3 className="font-bold mb-2">Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-base-content/70">Status</dt>
                <dd className="font-medium text-base-content">{ticket.status}</dd>
              </div>
              <div>
                <dt className="text-sm text-base-content/70">Priority</dt>
                <dd className="font-medium text-base-content">{ticket.priority}</dd>
              </div>
              <div>
                <dt className="text-sm text-base-content/70">Created</dt>
                <dd className="font-medium text-base-content">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </dd>
              </div>
              {ticket.resolved_at && (
                <div>
                  <dt className="text-sm text-base-content/70">Resolved</dt>
                  <dd className="font-medium text-base-content">
                    {new Date(ticket.resolved_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {ticket.tags?.length > 0 && (
            <div className="bg-base-100 rounded-box shadow p-4">
              <h3 className="font-bold mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map(tag => (
                  <div key={tag} className="badge badge-outline">
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 