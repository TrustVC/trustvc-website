import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVerify, makeExplorerAddressURL } from './useVerify'
import { DocumentProvider } from '../../common/contexts/DocumentContext'

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

vi.mock('@trustvc/trustvc', async importOriginal => {
  const actual = await importOriginal<typeof import('@trustvc/trustvc')>()

  // Create mock chain info with all required properties
  const createMockChainInfo = (
    id: string,
    name: string,
    rpcUrl: string,
    explorerUrl: string
  ) => ({
    id,
    name,
    label: name,
    rpcUrl,
    explorerUrl,
    type: 'production' as const,
    currency: 'ETH',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  })

  return {
    ...actual,
    verifyDocument: vi.fn(),
    getChainId: vi.fn(),
    isTransferableRecord: vi.fn(),
    isDocumentRevokable: vi.fn(),
    SUPPORTED_CHAINS: {
      '1': createMockChainInfo(
        '1',
        'homestead',
        'https://eth-mainnet.example.com',
        'https://etherscan.io'
      ),
      '137': createMockChainInfo(
        '137',
        'matic',
        'https://polygon.example.com',
        'https://polygonscan.com'
      ),
      '50': createMockChainInfo(
        '50',
        'xdc',
        'https://xdc-rpc.com',
        'https://xdc-explorer.io'
      ),
      '101010': createMockChainInfo(
        '101010',
        'stability',
        'https://stability-rpc.com',
        'https://stability-explorer.io'
      ),
      '1338': createMockChainInfo(
        '1338',
        'astron',
        'https://astron-rpc.com',
        'https://astron-explorer.io'
      ),
      '11155111': createMockChainInfo(
        '11155111',
        'sepolia',
        'https://sepolia-rpc.com',
        'https://sepolia-explorer.io'
      ),
      '80002': createMockChainInfo(
        '80002',
        'amoy',
        'https://amoy-rpc.com',
        'https://amoy-explorer.io'
      ),
      '51': createMockChainInfo(
        '51',
        'xdcapothem',
        'https://apothem-rpc.com',
        'https://apothem-explorer.io'
      ),
      '20180427': createMockChainInfo(
        '20180427',
        'stabilitytestnet',
        'https://stability-test-rpc.com',
        'https://stability-test-explorer.io'
      ),
      '21002': createMockChainInfo(
        '21002',
        'astrontestnet',
        'https://astron-test-rpc.com',
        'https://astron-test-explorer.io'
      ),
    },
    // Document type predicates used in getIssuerName / getDocumentTags
    isWrappedV2Document: vi.fn().mockReturnValue(false),
    isWrappedV3Document: vi.fn().mockReturnValue(false),
    isRawV2Document: vi.fn().mockReturnValue(false),
    isSignedWrappedV2Document: vi.fn().mockReturnValue(false),
    isRawV3Document: vi.fn().mockReturnValue(false),
    isSignedWrappedV3Document: vi.fn().mockReturnValue(false),
    // Title escrow helpers used in detectTokenRegistryVersion
    isTitleEscrowVersion: vi.fn().mockResolvedValue(false),
    TitleEscrowInterface: { V4: 'V4', V5: 'V5' },
    getTokenRegistryAddress: vi.fn().mockReturnValue(undefined),
    getTokenId: vi.fn().mockReturnValue(undefined),
    getDocumentData: vi.fn().mockReturnValue({ id: 'test-key-id' }),
    // Namespace objects (only methods used in the source are stubbed)
    utils: {},
    v2: {},
    v3: {},
    vc: {
      isSignedDocument: vi.fn().mockReturnValue(false),
      isRawDocument: vi.fn().mockReturnValue(false),
      isSignedDocumentV2_0: vi.fn().mockReturnValue(false),
    },
  }
})

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

// Wrapper to provide DocumentContext to the hook
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(DocumentProvider, null, children)
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
      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })

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
      const { result } = renderHook(() => useVerify(), { wrapper })
      act(() => {
        result.current.handleDrag(makeDragEvent('dragenter'))
      })
      expect(result.current.dragActive).toBe(true)
    })

    it('sets dragActive true on dragover', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
      act(() => {
        result.current.handleDrag(makeDragEvent('dragover'))
      })
      expect(result.current.dragActive).toBe(true)
    })

    it('sets dragActive false on dragleave', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
      act(() => {
        result.current.handleDrag(makeDragEvent('dragenter'))
      })
      act(() => {
        result.current.handleDrag(makeDragEvent('dragleave'))
      })
      expect(result.current.dragActive).toBe(false)
    })

    it('calls preventDefault and stopPropagation', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
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
      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('invalid'))
    })

    it('sets error with SyntaxError message on invalid JSON', async () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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
      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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
      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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

      const { result } = renderHook(() => useVerify(), { wrapper })
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
      const { result } = renderHook(() => useVerify(), { wrapper })
      expect(result.current.getGroupStatus('DOCUMENT_INTEGRITY')).toBe(
        'INVALID'
      )
    })
  })

  // ── New state values (issuerName, isTransferable, tags) ───────────────────

  describe('new state values', () => {
    it('starts with empty issuerName', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
      expect(result.current.issuerName).toBe('')
    })

    it('starts with isTransferable false', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
      expect(result.current.isTransferable).toBe(false)
    })

    it('starts with an empty tags array', () => {
      const { result } = renderHook(() => useVerify(), { wrapper })
      expect(result.current.tags).toEqual([])
    })

    it('sets isTransferable to true when document is a transferable record', async () => {
      vi.mocked(verifyDocument).mockResolvedValue([
        {
          name: 'OpenAttestationHash',
          status: 'VALID',
          type: 'DOCUMENT_INTEGRITY',
        },
      ])
      vi.mocked(getChainId).mockReturnValue('1' as any)
      vi.mocked(isTransferableRecord).mockReturnValue(true)
      vi.mocked(isDocumentRevokable).mockReturnValue(false)

      const { result } = renderHook(() => useVerify(), { wrapper })
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(['valid', 'invalid']).toContain(result.current.verifyStatus)
      )
      expect(result.current.isTransferable).toBe(true)
    })

    it('sets isTransferable to false when document is not transferable', async () => {
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

      const { result } = renderHook(() => useVerify(), { wrapper })
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() =>
        expect(['valid', 'invalid']).toContain(result.current.verifyStatus)
      )
      expect(result.current.isTransferable).toBe(false)
    })

    it('resets issuerName, isTransferable, and tags on handleReset', async () => {
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

      const { result } = renderHook(() => useVerify(), { wrapper })
      await act(async () => {
        triggerFileInput(result, makeFile({ test: true }))
      })
      await waitFor(() => expect(result.current.verifyStatus).toBe('valid'))

      act(() => {
        result.current.handleReset()
      })

      expect(result.current.issuerName).toBe('')
      expect(result.current.isTransferable).toBe(false)
      expect(result.current.tags).toEqual([])
    })
  })

  // ── makeExplorerAddressURL ─────────────────────────────────────────────────

  describe('makeExplorerAddressURL', () => {
    it('returns undefined for an unknown chainId', () => {
      expect(makeExplorerAddressURL('0xabc', '9999')).toBeUndefined()
    })

    it('builds the correct explorer URL for a known chain with an explorerUrl', () => {
      // chainId '1' mock has explorerUrl: 'https://etherscan.io'
      const url = makeExplorerAddressURL('0xdeadbeef', '1')
      expect(url).toBe('https://etherscan.io/address/0xdeadbeef')
    })

    it('builds the correct explorer URL for another known chain', () => {
      // chainId '137' mock has explorerUrl: 'https://polygonscan.com'
      const url = makeExplorerAddressURL('0xcafe', '137')
      expect(url).toBe('https://polygonscan.com/address/0xcafe')
    })
  })
})
