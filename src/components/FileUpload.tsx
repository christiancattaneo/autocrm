import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { TicketAttachment } from '../types/ticket'

interface FileUploadProps {
  onUpload: (attachments: TicketAttachment[]) => void
  maxFiles?: number
  maxSize?: number // in MB
}

export function FileUpload({ onUpload, maxFiles = 5, maxSize = 10 }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    await uploadFiles(files)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await uploadFiles(files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFiles = async (files: File[]) => {
    if (files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert(`Files must be smaller than ${maxSize}MB`)
      return
    }

    setIsUploading(true)
    const attachments: TicketAttachment[] = []

    try {
      for (const file of files) {
        const fileId = crypto.randomUUID()
        const ext = file.name.split('.').pop()
        const path = `attachments/${fileId}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(path, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('tickets')
          .getPublicUrl(path)

        attachments.push({
          id: fileId,
          filename: file.name,
          filesize: file.size,
          content_type: file.type,
          created_at: new Date().toISOString(),
          url: publicUrl,
        })
      }

      onUpload(attachments)
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error uploading files')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? 'border-primary bg-primary/5' : 'border-base-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
      
      <div className="space-y-2">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Uploading...
            </>
          ) : (
            'Choose Files'
          )}
        </button>
        <p className="text-sm text-base-content/70">
          or drag and drop files here
        </p>
        <p className="text-xs text-base-content/50">
          Maximum {maxFiles} files, up to {maxSize}MB each
        </p>
      </div>
    </div>
  )
} 