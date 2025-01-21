import type { TicketAttachment } from '../types/ticket'

interface AttachmentListProps {
  attachments: TicketAttachment[]
  onRemove?: (attachment: TicketAttachment) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function AttachmentList({ attachments, onRemove }: AttachmentListProps) {
  if (attachments.length === 0) return null

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-2 p-2 bg-base-200 rounded-lg"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium truncate hover:text-primary"
              >
                {attachment.filename}
              </a>
              <span className="text-xs text-base-content/50">
                {formatFileSize(attachment.filesize)}
              </span>
            </div>
          </div>
          {onRemove && (
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-square"
              onClick={() => onRemove(attachment)}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
} 