export const ATTACHMENT_CONFIG = {
  maxTotalBytes: 10 * 1024 * 1024,
  maxFiles: 10,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'] as const,
  allowedExtensions: ['.jpg', '.jpeg', '.png'] as const,
}

export const MAX_TOTAL_UPLOAD_BYTES = ATTACHMENT_CONFIG.maxTotalBytes
export const MAX_FILES = ATTACHMENT_CONFIG.maxFiles

export function isValidFileType(file: File): boolean {
  const lowerName = file.name.toLowerCase()
  const dotIndex = lowerName.lastIndexOf('.')
  const ext = dotIndex >= 0 ? lowerName.slice(dotIndex) : ''
  const normalizedType = file.type.toLowerCase()
  const typeAllowed = ATTACHMENT_CONFIG.allowedTypes.some(
    allowed => allowed === normalizedType
  )
  const extensionAllowed = ATTACHMENT_CONFIG.allowedExtensions.some(
    allowed => allowed === ext
  )
  return typeAllowed && extensionAllowed
}

export function getFileConstraintText(): string {
  return 'Maximum 10 MB total size. Supported files include .JPG or .PNG only.'
}
