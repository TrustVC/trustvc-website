import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVerify } from './useVerify'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_RPC_URL_1: 'https://eth-mainnet.example.com',
    VITE_RPC_URL_137: 'https://polygon.example.com',
  },
  writable: true,
})

// Polyfill File.prototype.text for test environment
if (!File.prototype.text) {
  File.prototype.text = function () {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsText(this)
    })
  }
}

vi.mock('@trustvc/trustvc', () => ({
  verifyDocument: vi.fn(),
  getChainId: vi.fn(),
  isTransferableRecord: vi.fn(),
  isDocumentRevokable: vi.fn(),
  SUPPORTED_CHAINS: {
    '1': { rpcUrl: 'https://eth-mainnet.example.com' },
    '137': { rpcUrl: 'https://polygon.example.com' },
  },
}))

import {
  verifyDocument,
  getChainId,
  isTransferableRecord,
  isDocumentRevokable,
} from '@trustvc/trustvc'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeFile = (content: object, name = 'doc.tt') =>
  new File([JSON.stringify(content)], name, { type: 'application/json' })

const makeDragEvent = (type: string, files: File[] = []) =>
  ({
    type,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: { files },
  }) as unknown as React.DragEvent

const triggerFileInput = (
  result: ReturnType<
    typeof renderHook<ReturnType<typeof useVerify>, unknown>
  >['result'],
  file: File
) => {
  result.current.handleFileInput({
    target: { files: [file], value: '' },
  } as unknown as React.ChangeEvent<HTMLInputElement>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useVerify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  // ── Initial state ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('starts idle with empty fields', () => {
      const { result } = renderHook(() => useVerify())
      expect(result.current.verifyStatus).toBe('idle')
      expect(result.current.fileName).toBe('')
      expect(result.current.errorMessage).toBe('')
      expect(result.current.dragActive).toBe(false)
    })
  })

  // ── handleReset ────────────────────────────────────────────────────────────

  describe('handleReset', () => {
    it('resets all state back to initial values', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())

      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.verifyStatus).toBe('idle')
      expect(result.current.fileName).toBe('')
      expect(result.current.errorMessage).toBe('')
      expect(result.current.dragActive).toBe(false)
    })
  })

  // ── handleDrag ─────────────────────────────────────────────────────────────

  describe('handleDrag', () => {
    it('sets dragActive true on dragenter', () => {
      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleDrag(makeDragEvent('dragenter'))
      })
      expect(result.current.dragActive).toBe(true)
    })

    it('sets dragActive true on dragover', () => {
      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleDrag(makeDragEvent('dragover'))
      })
      expect(result.current.dragActive).toBe(true)
    })

    it('sets dragActive false on dragleave', () => {
      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleDrag(makeDragEvent('dragenter'))
      })
      act(() => {
        result.current.handleDrag(makeDragEvent('dragleave'))
      })
      expect(result.current.dragActive).toBe(false)
    })

    it('calls preventDefault and stopPropagation', () => {
      const { result } = renderHook(() => useVerify())
      const event = makeDragEvent('dragenter')
      act(() => {
        result.current.handleDrag(event)
      })
      expect(event.preventDefault).toHaveBeenCalled()
      expect(event.stopPropagation).toHaveBeenCalled()
    })
  })

  // ── handleFileInput ────────────────────────────────────────────────────────

  describe('handleFileInput', () => {
    it('does nothing when no file is provided', () => {
      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleFileInput({
          target: { files: null, value: '' },
        } as unknown as React.ChangeEvent<HTMLInputElement>)
      })
      expect(result.current.verifyStatus).toBe('idle')
    })

    it('sets fileName immediately', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }, 'my-doc.tt'))
      })
      expect(result.current.fileName).toBe('my-doc.tt')
    })

    it('resolves to valid when all fragment groups are VALID', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
        {
          name: 'OpenAttestationEthereumDocumentStoreStatus',
          status: 'VALID',
          type: 'DOCUMENT_STATUS',
        },
      ])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))
    })

    it('resolves to invalid when any fragment group has INVALID status', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
        {
          name: 'OpenAttestationEthereumDocumentStoreStatus',
          status: 'INVALID',
          type: 'DOCUMENT_STATUS',
        },
      ])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('invalid'))
    })

    it('resolves to invalid when no fragments are returned', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('invalid'))
    })

    it('sets error with SyntaxError message on invalid JSON', async () => {
      const { result } = renderHook(() => useVerify())
      const badFile = new File(['not { valid json'], 'bad.tt', {
        type: 'text/plain',
      })
      await act(async () => {
        triggerFileInput(result, badFile)
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('error'))
      expect(result.current.errorMessage).toBe(
        'Invalid file format. Please upload a valid TrustVC document.'
      )
    })

    it('sets error with the thrown Error message when verifyDocument rejects', async () => {
      vi.mocked(verifyDocument).mockRejectedValue(new Error('RPC unavailable'))
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('error'))
      expect(result.current.errorMessage).toBe('RPC unavailable')
    })

    it('sets error with fallback message for non-Error throws', async () => {
      vi.mocked(verifyDocument).mockRejectedValue('something weird')
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('error'))
      expect(result.current.errorMessage).toBe(
        'Verification failed. Please try again.'
      )
    })

    it('transitions to network-select for a transferable record with no chainId', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }, 'tr.tt'))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )
      expect(result.current.fileName).toBe('tr.tt')
    })

    it('transitions to network-select for a revokable document with no chainId', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(true)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )
    })

    it('proceeds to verify (not network-select) for a plain doc with no chainId', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))
    })
  })

  // ── handleDrop ─────────────────────────────────────────────────────────────

  describe('handleDrop', () => {
    it('clears dragActive and processes the dropped file', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleDrag(makeDragEvent('dragenter'))
      })
      expect(result.current.dragActive).toBe(true)

      const file = makeFile({ test: true })
      await act(async () => {
        result.current.handleDrop(makeDragEvent('drop', [file]))
      })

      expect(result.current.dragActive).toBe(false)
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))
    })

    it('does nothing when drop contains no files', () => {
      const { result } = renderHook(() => useVerify())
      act(() => {
        result.current.handleDrop(makeDragEvent('drop', []))
      })
      expect(result.current.verifyStatus).toBe('idle')
    })
  })

  // ── handleNetworkCancel ────────────────────────────────────────────────────

  describe('handleNetworkCancel', () => {
    it('returns to idle and clears fileName', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }, 'pending.tt'))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )

      act(() => {
        result.current.handleNetworkCancel()
      })

      expect(result.current.verifyStatus).toBe('idle')
      expect(result.current.fileName).toBe('')
    })
  })

  // ── handleNetworkConfirm ───────────────────────────────────────────────────

  describe('handleNetworkConfirm', () => {
    it('does nothing when called with no pending document', async () => {
      const { result } = renderHook(() => useVerify())
      await act(async () => {
        result.current.handleNetworkConfirm('1')
      })
      expect(result.current.verifyStatus).toBe('idle')
      expect(verifyDocument).not.toHaveBeenCalled()
    })

    it('verifies with the selected chainId and resolves to valid', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )

      await act(async () => {
        result.current.handleNetworkConfirm('137')
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))
      expect(verifyDocument).toHaveBeenCalledTimes(1)
    })

    it('resolves to invalid when verification returns invalid fragments', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'INVALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )

      await act(async () => {
        result.current.handleNetworkConfirm('1')
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('invalid'))
    })

    it('sets error state when verification throws', async () => {
      vi.mocked(getChainId).mockReturnValue(null as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)
      vi.mocked(verifyDocument).mockRejectedValue(new Error('Network timeout'))

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(result.current.verifyStatus).toBe('network-select')
      )

      await act(async () => {
        result.current.handleNetworkConfirm('1')
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('error'))
      expect(result.current.errorMessage).toBe('Network timeout')
    })
  })

  // ── getGroupStatus ─────────────────────────────────────────────────────────

  describe('getGroupStatus', () => {
    const setup = async (
      fragments: {
        name: string
        status: 'VALID' | 'INVALID' | 'SKIPPED'
        type: 'DOCUMENT_INTEGRITY' | 'DOCUMENT_STATUS' | 'ISSUER_IDENTITY'
      }[]
    ) => {
      vi.mocked(verifyDocument).mockResolvedValue(fragments)
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(false)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify())
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(['valid', 'invalid']).toContain(result.current.verifyStatus)
      )
      return result
    }

    it('returns VALID when all fragments of a type are VALID', async () => {
      const result = await setup([
        { name: 'a', status: 'VALID', type: 'DOCUMENT_INTEGRITY' },
        { name: 'b', status: 'VALID', type: 'DOCUMENT_INTEGRITY' },
      ])
      expect(result.current.getGroupStatus('DOCUMENT_INTEGRITY')).toBe('VALID')
    })

    it('returns INVALID when any fragment of a type is INVALID', async () => {
      const result = await setup([
        { name: 'a', status: 'VALID', type: 'DOCUMENT_INTEGRITY' },
        { name: 'b', status: 'INVALID', type: 'DOCUMENT_INTEGRITY' },
      ])
      expect(result.current.getGroupStatus('DOCUMENT_INTEGRITY')).toBe(
        'INVALID'
      )
    })

    it('returns INVALID when all fragments of a type are SKIPPED', async () => {
      const result = await setup([
        { name: 'a', status: 'SKIPPED', type: 'DOCUMENT_INTEGRITY' },
        { name: 'b', status: 'SKIPPED', type: 'DOCUMENT_INTEGRITY' },
      ])
      expect(result.current.getGroupStatus('DOCUMENT_INTEGRITY')).toBe(
        'INVALID'
      )
    })

    it('returns INVALID for an unknown type with no matching fragments', async () => {
      const result = await setup([
        { name: 'a', status: 'VALID', type: 'DOCUMENT_INTEGRITY' },
      ])
      expect(result.current.getGroupStatus('UNKNOWN_TYPE')).toBe('INVALID')
    })

    it('returns INVALID before any file has been verified', () => {
      const { result } = renderHook(() => useVerify())
      expect(result.current.getGroupStatus('DOCUMENT_INTEGRITY')).toBe(
        'INVALID'
      )
    })
  })
})
