import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TicketPriority, TicketAttachment } from '../types/ticket'
import { RichTextEditor } from './RichTextEditor'
import { FileUpload } from './FileUpload'
import { AttachmentList } from './AttachmentList'
import { useAuth } from '../hooks/useAuth'

interface TicketFormProps {
  onTicketCreated?: () => void
}

export function TicketForm({ onTicketCreated }: TicketFormProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [internalNotes, setInternalNotes] = useState('')
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    if (e.key === 'Enter' && input.value.trim()) {
      e.preventDefault()
      setTags([...tags, input.value.trim()])
      input.value = ''
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAttachmentUpload = (newAttachments: TicketAttachment[]) => {
    setAttachments(prev => [...prev, ...newAttachments])
  }

  const handleAttachmentRemove = async (attachment: TicketAttachment) => {
    try {
      const path = attachment.url.split('/').pop()
      if (!path) throw new Error('Invalid attachment URL')

      const { error } = await supabase.storage
        .from('tickets')
        .remove([`attachments/${path}`])

      if (error) throw error

      setAttachments(prev => prev.filter(a => a.id !== attachment.id))
    } catch (error) {
      console.error('Error removing attachment:', error)
      alert('Error removing attachment')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    console.log('Starting ticket creation...', {
      user,
      title,
      description,
      priority,
      tags,
      internalNotes,
      attachments
    })

    try {
      console.log('Attempting to insert ticket with data:', {
        title,
        description,
        customer_email: user?.email,
        priority,
        status: 'open',
        tags,
        internal_notes: internalNotes || null,
        custom_fields: {},
        attachments,
      })

      const { data, error } = await supabase
        .from('tickets')
        .insert([
          {
            title,
            description,
            customer_email: user?.email,
            priority,
            status: 'open',
            tags,
            internal_notes: internalNotes || null,
            custom_fields: {},
            attachments,
          },
        ])
        .select()

      if (error) {
        console.error('Detailed error from Supabase:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log('Ticket created successfully:', data)

      // Clear form
      setTitle('')
      setDescription('')
      setPriority('medium')
      setTags([])
      setInternalNotes('')
      setAttachments([])
      onTicketCreated?.()
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert(error instanceof Error ? error.message : 'Error creating ticket!')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-black">New Ticket</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
            placeholder="Brief description of the issue"
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Description</span>
          </label>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Detailed explanation of your issue"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Priority</span>
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="select select-bordered w-full"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Tags</span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <div key={tag} className="badge badge-primary gap-1">
                {tag}
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => removeTag(tag)}
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
            onKeyDown={handleTagInput}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Internal Notes</span>
          </label>
          <RichTextEditor
            value={internalNotes}
            onChange={setInternalNotes}
            placeholder="Add internal notes (optional)"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Attachments</span>
          </label>
          <FileUpload onUpload={handleAttachmentUpload} />
          <div className="mt-2">
            <AttachmentList
              attachments={attachments}
              onRemove={handleAttachmentRemove}
            />
          </div>
        </div>

        <button
          type="submit"
          className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Ticket'}
        </button>
      </form>
    </div>
  )
} 