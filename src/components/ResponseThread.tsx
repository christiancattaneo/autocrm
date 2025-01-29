import { useState } from 'react'
import { TicketResponse } from '../types/ticket'
import { RichTextEditor } from './RichTextEditor'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface ResponseThreadProps {
  ticketId: number
  responses: TicketResponse[]
  onResponseAdded: () => void
}

export function ResponseThread({ ticketId, responses, onResponseAdded }: ResponseThreadProps) {
  const [newResponse, setNewResponse] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!newResponse.trim() || !user) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('ticket_responses')
        .insert({
          ticket_id: ticketId,
          content: newResponse,
          author_id: user.id,
          author_email: user.email,
          response_type: 'manual'
        })

      if (error) throw error

      setNewResponse('')
      onResponseAdded()
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('Error submitting response')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {responses.map((response) => (
          <div 
            key={response.id}
            className={`chat ${response.author_email === user?.email ? 'chat-end' : 'chat-start'}`}
          >
            <div className="chat-header">
              {response.author_email}
              <time className="text-xs opacity-50 ml-1">
                {new Date(response.created_at).toLocaleString()}
              </time>
            </div>
            <div className={`chat-bubble ${
              response.response_type === 'ai_generated' ? 'chat-bubble-info' :
              response.response_type === 'system' ? 'chat-bubble-warning' :
              response.author_email === user?.email ? 'chat-bubble-primary' : ''
            }`}>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: response.content }}
              />
            </div>
            {response.response_type === 'ai_generated' && (
              <div className="chat-footer opacity-50">
                AI Generated
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-base-100 rounded-box shadow p-4">
        <RichTextEditor
          value={newResponse}
          onChange={setNewResponse}
          placeholder="Type your response..."
        />
        <div className="flex justify-end mt-4">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !newResponse.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Sending...
              </>
            ) : (
              'Send Response'
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 