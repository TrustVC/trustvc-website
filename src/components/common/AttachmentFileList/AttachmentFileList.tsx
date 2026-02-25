import React from 'react'
import { FileItem } from '@/components/common/FileItem'
import type { AttachmentItem } from '@/types/attachment'

interface AttachmentFileListProps {
  attachments: AttachmentItem[]
  onRemove: (_id: string) => void
  onClearAll: () => void
  isDarkMode: boolean
}

export function AttachmentFileList({
  attachments,
  onRemove,
  onClearAll,
  isDarkMode,
}: AttachmentFileListProps) {
  if (attachments.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClearAll}
          className={`inline-flex items-center gap-1.5 text-sm transition-colors ${isDarkMode ? 'text-neutral-50 hover:text-neutral-60' : 'text-neutral-20 hover:text-neutral-10'}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <path
              d="M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v4M10 7v4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Clear All Files
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {attachments.map(item => (
          <FileItem
            key={item.id}
            item={item}
            onRemove={onRemove}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  )
}
