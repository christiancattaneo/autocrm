export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export type CustomField = string | number | boolean | null

export interface TicketAttachment {
  id: string
  filename: string
  filesize: number
  content_type: string
  created_at: string
  url: string
}

export type ResponseType = 'ai_generated' | 'manual' | 'system'

export interface TicketResponse {
  id: number
  ticket_id: number
  content: string
  author_id: string
  author_email: string
  response_type: ResponseType
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customer_email: string
  created_at: string
  updated_at: string
  tags: string[]
  internal_notes?: string
  assignee_id?: string
  custom_fields: Record<string, CustomField>
  resolved_at?: string
  attachments: TicketAttachment[]
  rating: number | null  // 1-5 star rating
  rating_comment: string | null  // Optional feedback from customer
  rated_at: string | null  // When the rating was submitted
  responses?: TicketResponse[]  // Added responses field
} 