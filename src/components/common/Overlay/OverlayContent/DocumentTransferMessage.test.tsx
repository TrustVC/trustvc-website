import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  DocumentTransferMessage,
  MessageTitle,
  showDocumentTransferMessage,
} from './DocumentTransferMessage'
import { OverlayProvider } from '../../contexts/OverlayContext'

const { mockCloseOverlay } = vi.hoisted(() => ({
  mockCloseOverlay: vi.fn(),
}))

vi.mock('../../contexts/OverlayContext', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../../contexts/OverlayContext')>()
  return {
    ...actual,
    useOverlayContext: () => ({
      closeOverlay: mockCloseOverlay,
      showOverlay: vi.fn(),
    }),
  }
})

vi.mock('./MessageAddressResolver', () => ({
  MessageAddressResolver: ({ address }: { address: string }) => (
    <span data-testid="address-resolver">{address}</span>
  ),
}))

vi.mock('@/components/icons/Success', () => ({
  default: () => <div data-testid="success-icon" />,
}))

vi.mock('@/components/icons/Error', () => ({
  default: () => <div data-testid="error-icon" />,
}))

const mockSetShowEndorsementChain = vi.fn()

const renderWithOverlay = (ui: React.ReactElement) =>
  render(<OverlayProvider>{ui}</OverlayProvider>)

describe('DocumentTransferMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('errorMessage prop', () => {
    it('renders both errorMessage and children when errorMessage is provided', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Failed"
          isSuccess={false}
          setShowEndorsementChain={mockSetShowEndorsementChain}
          errorMessage="User Rejected Transaction"
        >
          <span>default child content</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByText('User Rejected Transaction')).toBeInTheDocument()
      expect(screen.getByText('default child content')).toBeInTheDocument()
    })

    it('renders children when errorMessage is undefined', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>child content visible</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByText('child content visible')).toBeInTheDocument()
    })

    it('renders children when errorMessage is empty string', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
          errorMessage=""
        >
          <span>child content visible</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByText('child content visible')).toBeInTheDocument()
    })

    it('renders the errorMessage inside a paragraph element', () => {
      const { container } = renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Failed"
          isSuccess={false}
          setShowEndorsementChain={mockSetShowEndorsementChain}
          errorMessage="Insufficient Funds"
        >
          <span>child</span>
        </DocumentTransferMessage>
      )

      const paragraph = container.querySelector('p.mt-3')
      expect(paragraph?.textContent).toBe('Insufficient Funds')
    })
  })

  describe('title and icon rendering', () => {
    it('renders the title text', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>content</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByText('Transfer Holder Success')).toBeInTheDocument()
    })

    it('renders success icon when isSuccess is true', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>content</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByTestId('success-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('error-icon')).not.toBeInTheDocument()
    })

    it('renders error icon when isSuccess is false', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Failed"
          isSuccess={false}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>content</span>
        </DocumentTransferMessage>
      )

      expect(screen.getByTestId('error-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument()
    })
  })

  describe('buttons', () => {
    it('calls closeOverlay when Dismiss button is clicked', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>content</span>
        </DocumentTransferMessage>
      )

      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
      expect(mockCloseOverlay).toHaveBeenCalled()
    })

    it('calls setShowEndorsementChain and closeOverlay when View Endorsement Chain is clicked', () => {
      renderWithOverlay(
        <DocumentTransferMessage
          title="Transfer Holder Success"
          isSuccess={true}
          setShowEndorsementChain={mockSetShowEndorsementChain}
        >
          <span>content</span>
        </DocumentTransferMessage>
      )

      fireEvent.click(
        screen.getByRole('button', { name: 'View Endorsement Chain' })
      )

      expect(mockSetShowEndorsementChain).toHaveBeenCalledWith(true)
      expect(mockCloseOverlay).toHaveBeenCalled()
    })
  })
})

describe('showDocumentTransferMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes errorMessage to DocumentTransferMessage', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.TRANSFER_HOLDER_FAILED,
      { isSuccess: false },
      mockSetShowEndorsementChain,
      'User Rejected Transaction'
    ) as React.ReactElement

    expect(node.props.errorMessage).toBe('User Rejected Transaction')
  })

  it('passes undefined errorMessage when not provided', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.TRANSFER_HOLDER_SUCCESS,
      { isSuccess: true },
      mockSetShowEndorsementChain
    ) as React.ReactElement

    expect(node.props.errorMessage).toBeUndefined()
  })

  it('passes isSuccess from option to DocumentTransferMessage', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.TRANSFER_HOLDER_SUCCESS,
      { isSuccess: true },
      mockSetShowEndorsementChain
    ) as React.ReactElement

    expect(node.props.isSuccess).toBe(true)
  })

  it('passes the title to DocumentTransferMessage', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.NOMINATE_BENEFICIARY_FAILED,
      { isSuccess: false },
      mockSetShowEndorsementChain,
      'Network Error'
    ) as React.ReactElement

    expect(node.props.title).toBe(MessageTitle.NOMINATE_BENEFICIARY_FAILED)
    expect(node.props.errorMessage).toBe('Network Error')
  })

  it('renders TRANSFER_HOLDER children when no errorMessage', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.TRANSFER_HOLDER_FAILED,
      { isSuccess: false, holderAddress: '0xabc' },
      mockSetShowEndorsementChain
    ) as React.ReactElement

    const { getByText } = renderWithOverlay(node)
    expect(getByText('Transfer Holder Failed')).toBeInTheDocument()
  })

  it('renders errorMessage text in overlay when errorMessage set', () => {
    const node = showDocumentTransferMessage(
      MessageTitle.TRANSFER_HOLDER_FAILED,
      { isSuccess: false },
      mockSetShowEndorsementChain,
      'Insufficient Funds'
    ) as React.ReactElement

    const { getByText } = renderWithOverlay(node)
    expect(getByText('Insufficient Funds')).toBeInTheDocument()
  })
})
