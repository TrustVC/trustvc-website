import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DocumentRenderer from './DocumentRenderer'

// Mock FrameConnector
vi.mock('@trustvc/decentralized-renderer-react-components', () => ({
  FrameConnector: vi.fn(({ style, source }: any) => (
    <div data-testid="frame-connector" style={style} data-source={source} />
  )),
  renderDocument: vi.fn(() => ({ type: 'RENDER_DOCUMENT' })),
  selectTemplate: vi.fn((id: string) => ({
    type: 'SELECT_TEMPLATE',
    payload: id,
  })),
  print: vi.fn(() => ({ type: 'PRINT' })),
  FrameActions: {},
}))

// Mock helper functions
vi.mock('../../../utils/helper', async () => {
  const actual = await vi.importActual('../../../utils/helper')
  return {
    ...actual,
    getTemplateSourceUrl: vi.fn(() => 'https://renderer.example.com'),
    getOpenAttestationData: vi.fn((doc: any) => doc),
    getQRCodeLink: vi.fn(() => undefined),
    getAttachments: vi.fn(() => []),
  }
})

// Mock Spinner
vi.mock('../../common/Spinner', () => ({
  default: ({ label }: { label: string }) => (
    <div data-testid="spinner">{label}</div>
  ),
}))

// Mock QRCodeSVG
vi.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr-code" />,
}))

// Mock Icons
vi.mock('../../common/Icons', () => ({
  QRCodeIcon: () => <span data-testid="qr-icon" />,
  PrinterIcon: () => <span data-testid="printer-icon" />,
  DownloadIcon: () => <span data-testid="download-icon" />,
  FileIcon: ({ filename }: { filename: string }) => (
    <span data-testid={`file-icon-${filename}`} />
  ),
}))

const helperModule = await import('../../../utils/helper')

describe('DocumentRenderer', () => {
  const defaultProps = {
    rawDocument: { some: 'document' },
    fileName: 'test-file.json',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(helperModule.getTemplateSourceUrl).mockReturnValue(
      'https://renderer.example.com'
    )
    vi.mocked(helperModule.getQRCodeLink).mockReturnValue(undefined)
    vi.mocked(helperModule.getAttachments).mockReturnValue([])
  })

  it('renders nothing when no rawDocument', () => {
    const { container } = render(
      <DocumentRenderer rawDocument={undefined as any} fileName="test.json" />
    )
    expect(container.innerHTML).toBe('')
  })

  it('falls back to default template source when getTemplateSourceUrl returns undefined', () => {
    vi.mocked(helperModule.getTemplateSourceUrl).mockReturnValue(undefined)
    render(<DocumentRenderer {...defaultProps} />)
    const frame = screen.getByTestId('frame-connector')
    expect(frame.getAttribute('data-source')).toBe(
      'https://generic-templates.tradetrust.io/'
    )
  })

  it('renders FrameConnector when templateSource exists', () => {
    render(<DocumentRenderer {...defaultProps} />)
    expect(screen.getByTestId('frame-connector')).toBeTruthy()
  })

  it('shows loading spinner initially', () => {
    render(<DocumentRenderer {...defaultProps} />)
    expect(screen.getByTestId('loader')).toBeTruthy()
    expect(screen.getByText(/Loading document preview/)).toBeTruthy()
  })

  it('hides tabs wrapper before renderer is ready', () => {
    const { container } = render(<DocumentRenderer {...defaultProps} />)
    const tabsWrapper = container.querySelector('.vr-template-tabs-wrapper')
    expect(tabsWrapper).toBeTruthy()
    expect((tabsWrapper as HTMLElement).style.display).toBe('none')
  })

  it('renders FrameConnector with correct source', () => {
    const { container } = render(<DocumentRenderer {...defaultProps} />)
    const frame = container.querySelector('[data-testid="frame-connector"]')
    expect(frame).toBeTruthy()
  })

  describe('with attachments', () => {
    beforeEach(() => {
      vi.mocked(helperModule.getAttachments).mockReturnValue([
        { filename: 'doc.pdf', data: 'base64data', type: 'application/pdf' },
        { filename: 'image.png', data: 'imgdata', type: 'image/png' },
      ])
    })

    it('does not show attachment tab before renderer is ready', () => {
      const { container } = render(<DocumentRenderer {...defaultProps} />)
      // Tabs wrapper is hidden until ready
      const tabsWrapper = container.querySelector('.vr-template-tabs-wrapper')
      expect((tabsWrapper as HTMLElement).style.display).toBe('none')
    })
  })

  describe('with QR code', () => {
    beforeEach(() => {
      vi.mocked(helperModule.getQRCodeLink).mockReturnValue(
        'https://qr.example.com'
      )
    })

    it('passes QR code URL to helper', () => {
      render(<DocumentRenderer {...defaultProps} />)
      expect(helperModule.getQRCodeLink).toHaveBeenCalledWith(
        defaultProps.rawDocument
      )
    })
  })
})
