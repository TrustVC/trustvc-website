import React from 'react'
import { truncateFilename } from '@/types/attachment'
import type { AttachmentItem } from '@/types/attachment'

interface FileItemProps {
  item: AttachmentItem
  onRemove: (_id: string) => void
  isDarkMode: boolean
}

export function FileItem({ item, onRemove, isDarkMode }: FileItemProps) {
  const { id, filename, status, progress, error, previewUrl } = item
  const displayName = truncateFilename(filename, 36)
  const isUploading = status === 'uploading' || status === 'pending'
  const isError = status === 'error'

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 min-w-0 ${
        isDarkMode
          ? 'bg-black/10 border-white/15'
          : 'bg-white/90 border-black/10'
      } ${isError ? 'border-red-500' : ''}`}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-neutral-33/50 overflow-hidden">
        {isError ? (
          <span className="text-red-500 text-xs font-medium">!</span>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={filename}
            className="w-10 h-10 object-cover"
          />
        ) : isUploading ? (
          <div className="relative w-8 h-8">
            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className={
                  isDarkMode ? 'text-neutral-50/30' : 'text-neutral-20/30'
                }
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${progress * 1.02} 100`}
                strokeLinecap="round"
                className="text-primary-60 transition-all duration-300"
              />
            </svg>
          </div>
        ) : (
          <span
            className={`text-xs ${isDarkMode ? 'text-neutral-50' : 'text-neutral-20'}`}
          >
            Preview
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium truncate ${isDarkMode ? 'text-neutral-60' : 'text-neutral-10'}`}
          title={filename}
        >
          {displayName}
        </p>
        <p
          className={`text-xs mt-0.5 ${isError ? 'text-red-500' : isDarkMode ? 'text-neutral-50' : 'text-neutral-20'}`}
        >
          {isUploading
            ? `Uploading - ${progress}%`
            : status === 'uploaded'
              ? 'Uploaded'
              : error || 'Error'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(id)}
        className={`flex-shrink-0 p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-white/10 text-neutral-50' : 'hover:bg-black/10 text-neutral-20'}`}
        aria-label={`Remove ${filename}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M12 4L4 12M4 4l8 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
