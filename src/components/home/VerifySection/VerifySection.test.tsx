import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import VerifySection from './VerifySection'
import type { UseVerifyReturn } from './useVerify'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Mock NetworkModal to avoid VITE_NETWORK_TYPE env dependency
vi.mock('./NetworkModal', () => ({
  default: ({ fileName }: { fileName: string }) => (
    <div data-testid="network-modal">{fileName}</div>
  ),
}))

vi.mock('./useVerify', () => ({ useVerify: vi.fn() }))

import { useVerify } from './useVerify'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultHook: UseVerifyReturn = {
  verifyStatus: 'idle',
  fileName: '',
  errorMessage: '',
  dragActive: false,
  isTransferable: false,
  tokenRegistryVersion: null,
  tags: [],
  getGroupStatus: vi.fn().mockReturnValue('VALID' as const),
  handleDrag: vi.fn(),
  handleDrop: vi.fn(),
  handleFileInput: vi.fn(),
  handleReset: vi.fn(),
  handleNetworkConfirm: vi.fn(),
  handleNetworkCancel: vi.fn(),
}

const setStatus = (overrides: Partial<UseVerifyReturn>) => {
  vi.mocked(useVerify).mockReturnValue({ ...defaultHook, ...overrides })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VerifySection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStatus({})
  })

  // ── Idle ───────────────────────────────────────────────────────────────────

  describe('idle state', () => {
    it('renders the dropzone text', () => {
      render(<VerifySection isDarkMode={false} />)
      expect(
        screen.getByText(/Drop TrustVC files here to verify/i)
      ).toBeInTheDocument()
    })

    it('renders the Browse Files button', () => {
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText(/Browse Files/i)).toBeInTheDocument()
    })

    it('does not render the spinner or result', () => {
      render(<VerifySection isDarkMode={false} />)
      expect(screen.queryByText(/Verifying/i)).not.toBeInTheDocument()
      expect(screen.queryByText('Document Verified')).not.toBeInTheDocument()
    })
  })

  // ── Verifying ──────────────────────────────────────────────────────────────

  describe('verifying state', () => {
    it('shows spinner with the fileName', () => {
      setStatus({ verifyStatus: 'verifying', fileName: 'doc.tt' })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText('Verifying doc.tt...')).toBeInTheDocument()
    })

    it('does not show the dropzone', () => {
      setStatus({ verifyStatus: 'verifying', fileName: 'doc.tt' })
      render(<VerifySection isDarkMode={false} />)
      expect(
        screen.queryByText(/Drop TrustVC files here to verify/i)
      ).not.toBeInTheDocument()
    })
  })

  // ── Valid ──────────────────────────────────────────────────────────────────

  describe('valid state', () => {
    it('renders VerifyResult with the fileName', () => {
      setStatus({ verifyStatus: 'valid', fileName: 'valid-doc.tt' })
      render(<VerifySection isDarkMode={false} />)
      expect(
        screen.getByRole('button', { name: /upload new file/i })
      ).toBeInTheDocument()
      expect(screen.getByText('valid-doc.tt')).toBeInTheDocument()
    })

    it('does not render VerifyError', () => {
      setStatus({ verifyStatus: 'valid' })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.queryByText('Try again')).not.toBeInTheDocument()
    })
  })

  // ── Invalid ────────────────────────────────────────────────────────────────

  describe('invalid state', () => {
    it('renders VerifyError instead of VerifyResult', () => {
      setStatus({
        verifyStatus: 'invalid',
        errorMessage: 'Verification Failed',
      })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.queryByText('Document Verified')).not.toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('shows the errorMessage from the hook', () => {
      setStatus({
        verifyStatus: 'invalid',
        errorMessage: 'Verification Failed',
      })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })

    it('falls back to "Verification Failed" when errorMessage is empty', () => {
      setStatus({ verifyStatus: 'invalid', errorMessage: '' })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })
  })

  // ── Error ──────────────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders VerifyError with the errorMessage', () => {
      setStatus({
        verifyStatus: 'error',
        errorMessage:
          'Invalid file format. Please upload a valid TrustVC document.',
      })
      render(<VerifySection isDarkMode={false} />)
      expect(
        screen.getByText(
          'Invalid file format. Please upload a valid TrustVC document.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Try again')).toBeInTheDocument()
    })

    it('falls back to "Verification Failed" when errorMessage is empty', () => {
      setStatus({ verifyStatus: 'error', errorMessage: '' })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText('Verification Failed')).toBeInTheDocument()
    })
  })

  // ── Network select ─────────────────────────────────────────────────────────

  describe('network-select state', () => {
    it('renders the dropzone and the NetworkModal', () => {
      setStatus({ verifyStatus: 'network-select', fileName: 'pending.tt' })
      render(<VerifySection isDarkMode={false} />)
      expect(
        screen.getByText(/Drop TrustVC files here to verify/i)
      ).toBeInTheDocument()
      expect(screen.getByTestId('network-modal')).toBeInTheDocument()
    })

    it('passes the fileName to NetworkModal', () => {
      setStatus({ verifyStatus: 'network-select', fileName: 'pending.tt' })
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByTestId('network-modal').textContent).toBe('pending.tt')
    })
  })

  // ── Dark mode ──────────────────────────────────────────────────────────────

  describe('dark mode', () => {
    it('applies dark-mode class when isDarkMode is true', () => {
      const { container } = render(<VerifySection isDarkMode={true} />)
      expect(container.querySelector('.verify-section')).toHaveClass(
        'dark-mode'
      )
    })

    it('does not apply dark-mode class when isDarkMode is false', () => {
      const { container } = render(<VerifySection isDarkMode={false} />)
      expect(container.querySelector('.verify-section')).not.toHaveClass(
        'dark-mode'
      )
    })
  })

  // ── Demo section ───────────────────────────────────────────────────────────

  describe('demo section', () => {
    it('renders the demo heading and description', () => {
      render(<VerifySection isDarkMode={false} />)
      expect(screen.getByText(/Try our demo document!/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Experience the interoperability of our documents/i)
      ).toBeInTheDocument()
    })

    it('navigates to root when Visit Document Gallery is clicked', () => {
      render(<VerifySection isDarkMode={false} />)
      const ctaButton = screen
        .getByText(/Visit Document Gallery/i)
        .closest('.cta-button')
      fireEvent.click(ctaButton as HTMLElement)
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})
