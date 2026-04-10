import { describe, it, expect } from 'vitest'
import {
  ATTACHMENT_CONFIG,
  MAX_TOTAL_UPLOAD_BYTES,
  MAX_FILES,
  isValidFileType,
  getFileConstraintText,
} from './attachmentConfig'

describe('attachmentConfig', () => {
  describe('constants', () => {
    it('MAX_TOTAL_UPLOAD_BYTES equals 10 MB', () => {
      expect(MAX_TOTAL_UPLOAD_BYTES).toBe(10 * 1024 * 1024)
    })

    it('MAX_FILES equals 10', () => {
      expect(MAX_FILES).toBe(10)
    })

    it('ATTACHMENT_CONFIG has correct allowed types', () => {
      expect(ATTACHMENT_CONFIG.allowedTypes).toContain('image/jpeg')
      expect(ATTACHMENT_CONFIG.allowedTypes).toContain('image/jpg')
      expect(ATTACHMENT_CONFIG.allowedTypes).toContain('image/png')
    })

    it('ATTACHMENT_CONFIG has correct allowed extensions', () => {
      expect(ATTACHMENT_CONFIG.allowedExtensions).toContain('.jpg')
      expect(ATTACHMENT_CONFIG.allowedExtensions).toContain('.jpeg')
      expect(ATTACHMENT_CONFIG.allowedExtensions).toContain('.png')
    })
  })

  describe('isValidFileType', () => {
    it('accepts valid JPEG file', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
      expect(isValidFileType(file)).toBe(true)
    })

    it('accepts valid PNG file', () => {
      const file = new File(['data'], 'image.png', { type: 'image/png' })
      expect(isValidFileType(file)).toBe(true)
    })

    it('accepts .jpeg extension', () => {
      const file = new File(['data'], 'photo.jpeg', { type: 'image/jpeg' })
      expect(isValidFileType(file)).toBe(true)
    })

    it('rejects PDF file', () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' })
      expect(isValidFileType(file)).toBe(false)
    })

    it('rejects file with wrong extension but correct MIME', () => {
      const file = new File(['data'], 'photo.gif', { type: 'image/jpeg' })
      expect(isValidFileType(file)).toBe(false)
    })

    it('rejects file with correct extension but wrong MIME', () => {
      const file = new File(['data'], 'photo.jpg', { type: 'text/plain' })
      expect(isValidFileType(file)).toBe(false)
    })

    it('handles uppercase extension', () => {
      const file = new File(['data'], 'PHOTO.JPG', { type: 'image/jpeg' })
      expect(isValidFileType(file)).toBe(true)
    })

    it('rejects file with no extension', () => {
      const file = new File(['data'], 'photo', { type: 'image/jpeg' })
      expect(isValidFileType(file)).toBe(false)
    })
  })

  describe('getFileConstraintText', () => {
    it('returns constraint description', () => {
      const text = getFileConstraintText()
      expect(text).toContain('10 MB')
      expect(text).toContain('.JPG')
      expect(text).toContain('.PNG')
    })
  })
})
