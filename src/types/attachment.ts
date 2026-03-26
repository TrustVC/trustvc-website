export type AttachmentFileStatus =
  | 'pending'
  | 'uploading'
  | 'uploaded'
  | 'error'

export interface AttachmentItem {
  id: string
  file: File
  key?: string
  filename: string
  status: AttachmentFileStatus
  progress: number
  error?: string
  previewUrl?: string
}

export function truncateFilename(name: string, maxLength = 32): string {
  if (name.length <= maxLength) return name
  const dotIndex = name.lastIndexOf('.')
  const hasExtension = dotIndex > 0
  const ext = hasExtension ? name.slice(dotIndex) : ''
  const base = hasExtension ? name.slice(0, dotIndex) : name
  const keep = maxLength - ext.length - 3
  return base.slice(0, Math.max(0, keep)) + '...' + ext
}
}
