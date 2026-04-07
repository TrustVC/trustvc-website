import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getRpcUrl,
  toErrorMessage,
  formatAddress,
  getTemplateSourceUrl,
  getOpenAttestationData,
  getQRCodeLink,
  getAttachments,
  formatFileSize,
  getFileExtension,
} from './helper'

// Mock @trustvc/trustvc
vi.mock('@trustvc/trustvc', () => ({
  SUPPORTED_CHAINS: {
    '1': { rpcUrl: 'https://mainnet.infura.io' },
    '137': { rpcUrl: 'https://polygon-rpc.com' },
    '999': { rpcUrl: 'https://undefined-key.io/undefined' },
  },
  vc: {
    isSignedDocument: vi.fn(() => false),
    isRawDocument: vi.fn(() => false),
  },
  getDocumentData: vi.fn((doc: any) => doc?.data ?? doc),
  getDataV2: vi.fn((doc: any) => doc?.data ?? doc),
  isWrappedV2Document: vi.fn(() => false),
  isWrappedV3Document: vi.fn(() => false),
  isRawV2Document: vi.fn(() => false),
  isRawV3Document: vi.fn(() => false),
}))

const trustvc = await import('@trustvc/trustvc')

describe('getRpcUrl', () => {
  it('returns env variable if set', () => {
    const originalEnv = import.meta.env.VITE_RPC_URL_1
    import.meta.env.VITE_RPC_URL_1 = 'https://custom-rpc.io'
    expect(getRpcUrl('1')).toBe('https://custom-rpc.io')
    if (originalEnv) {
      import.meta.env.VITE_RPC_URL_1 = originalEnv
    } else {
      delete import.meta.env.VITE_RPC_URL_1
    }
  })

  it('returns chain default URL from SUPPORTED_CHAINS', () => {
    const result = getRpcUrl('137')
    expect(typeof result).toBe('string')
    expect(result).toBeTruthy()
  })

  it('returns null for unrecognised chain', () => {
    expect(getRpcUrl('99999')).toBeNull()
  })
})

describe('toErrorMessage', () => {
  it('returns specific message for SyntaxError', () => {
    expect(toErrorMessage(new SyntaxError('bad json'))).toBe(
      'Invalid file format. Please upload a valid TrustVC document.'
    )
  })

  it('returns error message for generic Error', () => {
    expect(toErrorMessage(new Error('something broke'))).toBe('something broke')
  })

  it('returns fallback for non-Error values', () => {
    expect(toErrorMessage('string error')).toBe(
      'Verification failed. Please try again.'
    )
  })

  it('returns custom fallback', () => {
    expect(toErrorMessage(42, 'Custom fallback')).toBe('Custom fallback')
  })
})

describe('formatAddress', () => {
  it('truncates a long address', () => {
    expect(formatAddress('0x28F7aB32C521D13F2E6980d072Ca7CA493020145')).toBe(
      '0x28F7...0145'
    )
  })

  it('returns short address as-is', () => {
    expect(formatAddress('0x1234')).toBe('0x1234')
  })

  it('returns empty string as-is', () => {
    expect(formatAddress('')).toBe('')
  })

  it('supports custom prefix/suffix lengths', () => {
    expect(
      formatAddress('0x28F7aB32C521D13F2E6980d072Ca7CA493020145', 10, 6)
    ).toBe('0x28F7aB32...020145')
  })
})

describe('formatFileSize', () => {
  it('returns empty string for empty data', () => {
    expect(formatFileSize('')).toBe('')
  })

  it('returns bytes for small data', () => {
    // 4 base64 chars = 3 bytes
    expect(formatFileSize('AAAA')).toBe('3 B')
  })

  it('returns KB for medium data', () => {
    // ~1400 base64 chars ≈ 1050 bytes ≈ 1.0 KB
    const data = 'A'.repeat(1400)
    expect(formatFileSize(data)).toBe('1.0 KB')
  })

  it('returns MB for large data', () => {
    // ~1,400,000 base64 chars ≈ 1,050,000 bytes ≈ 1.0 MB
    const data = 'A'.repeat(1400000)
    expect(formatFileSize(data)).toBe('1.0 MB')
  })

  it('accounts for base64 padding characters', () => {
    // 'AA==' is 4 chars with 2 padding = 1 byte
    expect(formatFileSize('AA==')).toBe('1 B')
    // 'AAA=' is 4 chars with 1 padding = 2 bytes
    expect(formatFileSize('AAA=')).toBe('2 B')
  })
})

describe('getFileExtension', () => {
  it('extracts extension from filename', () => {
    expect(getFileExtension('document.pdf', '')).toBe('PDF')
  })

  it('extracts extension from filename with multiple dots', () => {
    expect(getFileExtension('my.file.json', '')).toBe('JSON')
  })

  it('falls back to mimeType for pdf', () => {
    expect(getFileExtension('', 'application/pdf')).toBe('PDF')
  })

  it('falls back to mimeType for png', () => {
    expect(getFileExtension('', 'image/png')).toBe('PNG')
  })

  it('falls back to mimeType for jpeg', () => {
    expect(getFileExtension('', 'image/jpeg')).toBe('JPG')
  })

  it('falls back to mimeType for csv', () => {
    expect(getFileExtension('', 'text/csv')).toBe('CSV')
  })

  it('falls back to mimeType for xml', () => {
    expect(getFileExtension('', 'application/xml')).toBe('XML')
  })

  it('falls back to mimeType for plain text', () => {
    expect(getFileExtension('', 'text/plain')).toBe('TXT')
  })

  it('returns FILE for unknown type', () => {
    expect(getFileExtension('', 'application/octet-stream')).toBe('FILE')
  })

  it('prefers filename extension over mimeType', () => {
    expect(getFileExtension('file.csv', 'application/pdf')).toBe('CSV')
  })
})

describe('getTemplateSourceUrl', () => {
  beforeEach(() => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(false)
    vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(false)
  })

  it('returns undefined for null document', () => {
    expect(getTemplateSourceUrl(null)).toBeUndefined()
  })

  it('extracts URL from W3C VC renderMethod', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    const doc = { renderMethod: [{ id: 'https://renderer.example.com' }] }
    expect(getTemplateSourceUrl(doc)).toBe('https://renderer.example.com')
  })

  it('extracts URL from OA V2 $template', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    vi.mocked(trustvc.getDocumentData).mockReturnValue({
      $template: { url: 'https://v2-renderer.example.com' },
    } as any)
    const doc = {
      data: { $template: { url: 'https://v2-renderer.example.com' } },
    }
    expect(getTemplateSourceUrl(doc)).toBe('https://v2-renderer.example.com')
  })

  it('extracts URL from OA V3 metadata', () => {
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(true)
    const doc = {
      openAttestationMetadata: {
        template: { url: 'https://v3-renderer.example.com' },
      },
    }
    expect(getTemplateSourceUrl(doc)).toBe('https://v3-renderer.example.com')
  })

  it('returns undefined for unrecognised document', () => {
    expect(getTemplateSourceUrl({ foo: 'bar' })).toBeUndefined()
  })
})

describe('getOpenAttestationData', () => {
  beforeEach(() => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(false)
    vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(false)
  })

  it('returns raw document for W3C VC', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    const doc = { issuer: 'did:example:123' }
    expect(getOpenAttestationData(doc)).toBe(doc)
  })

  it('calls getDocumentData for OA documents', () => {
    const doc = { data: { name: 'test' } }
    vi.mocked(trustvc.getDocumentData).mockReturnValue({ name: 'test' } as any)
    expect(getOpenAttestationData(doc)).toEqual({ name: 'test' })
  })
})

describe('getQRCodeLink', () => {
  beforeEach(() => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(false)
    vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(false)
    vi.mocked(trustvc.isRawV2Document).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(false)
    vi.mocked(trustvc.isRawV3Document).mockReturnValue(false)
  })

  it('returns undefined for null document', () => {
    expect(getQRCodeLink(null)).toBeUndefined()
  })

  it('extracts link from OA V2 document', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    vi.mocked(trustvc.getDataV2).mockReturnValue({
      links: { self: { href: 'https://action.example.com' } },
    } as any)
    const doc = {}
    expect(getQRCodeLink(doc)).toBe('https://action.example.com')
  })

  it('extracts link from OA V3 document', () => {
    vi.mocked(trustvc.isRawV3Document).mockReturnValue(true)
    const doc = {
      credentialSubject: {
        links: { self: { href: 'https://v3-action.example.com' } },
      },
    }
    expect(getQRCodeLink(doc)).toBe('https://v3-action.example.com')
  })

  it('extracts URI from W3C VC qrCode', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    const doc = { qrCode: { uri: 'https://qr.example.com' } }
    expect(getQRCodeLink(doc)).toBe('https://qr.example.com')
  })

  it('returns undefined for unrecognised document', () => {
    expect(getQRCodeLink({ foo: 'bar' })).toBeUndefined()
  })
})

describe('getAttachments', () => {
  beforeEach(() => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(false)
    vi.mocked(trustvc.vc.isRawDocument).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(false)
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(false)
  })

  it('returns empty array for null document', () => {
    expect(getAttachments(null)).toEqual([])
  })

  it('returns empty array for unrecognised document', () => {
    expect(getAttachments({ foo: 'bar' })).toEqual([])
  })

  it('extracts attachments from OA V2 document', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    vi.mocked(trustvc.getDataV2).mockReturnValue({
      attachments: [
        { filename: 'test.pdf', data: 'base64data', type: 'application/pdf' },
      ],
    } as any)
    const result = getAttachments({})
    expect(result).toEqual([
      { filename: 'test.pdf', data: 'base64data', type: 'application/pdf' },
    ])
  })

  it('extracts and maps attachments from OA V3 document', () => {
    vi.mocked(trustvc.isWrappedV3Document).mockReturnValue(true)
    const doc = {
      attachments: [
        { fileName: 'doc.pdf', data: 'abc123', mimeType: 'application/pdf' },
      ],
    }
    const result = getAttachments(doc)
    expect(result).toEqual([
      { filename: 'doc.pdf', data: 'abc123', type: 'application/pdf' },
    ])
  })

  it('extracts attachments from W3C VC credentialSubject', () => {
    vi.mocked(trustvc.vc.isSignedDocument).mockReturnValue(true)
    const doc = {
      credentialSubject: {
        attachments: [
          { filename: 'file.png', data: 'imgdata', mimeType: 'image/png' },
        ],
      },
    }
    const result = getAttachments(doc)
    expect(result).toEqual([
      { filename: 'file.png', data: 'imgdata', type: 'image/png' },
    ])
  })

  it('returns empty array for V2 document without attachments', () => {
    vi.mocked(trustvc.isWrappedV2Document).mockReturnValue(true)
    vi.mocked(trustvc.getDataV2).mockReturnValue({} as any)
    expect(getAttachments({})).toEqual([])
  })
})
