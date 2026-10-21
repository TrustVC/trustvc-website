import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import {
  FrameConnector,
  print as framePrint,
} from '@trustvc/decentralized-renderer-react-components'
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

describe('DocumentRenderer — inline template', () => {
  const fallbackUrl = 'https://renderer.example.com'
  const template = {
    templateName: 'BILL_OF_LADING',
    html: '<div class="bol"><span data-field="blNumber"></span></div>',
    css: '.bol { color: red; }',
  }
  const urlEntry = {
    id: fallbackUrl,
    type: 'EMBEDDED_RENDERER',
    templateName: 'BILL_OF_LADING',
  }
  const legacyDocument = {
    renderMethod: [urlEntry],
    credentialSubject: { blNumber: 'BL-1' },
  }
  const inlineDocument = {
    renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template }, urlEntry],
    credentialSubject: { blNumber: 'BL-1' },
  }
  const brokenInlineDocument = {
    renderMethod: [
      { type: 'INLINE_HTML_TEMPLATE', template: 'not-gzip' },
      urlEntry,
    ],
    credentialSubject: {},
  }

  const getInlineFrame = () =>
    screen.queryByTestId('inline-template-renderer')?.querySelector('iframe')

  // The props the (mocked) FrameConnector was last rendered with, to drive it like the
  // real decentralised renderer would.
  const lastFrameProps = () =>
    vi.mocked(FrameConnector).mock.lastCall?.[0] as any

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(helperModule.getTemplateSourceUrl).mockReturnValue(fallbackUrl)
    vi.mocked(helperModule.getQRCodeLink).mockReturnValue(undefined)
    vi.mocked(helperModule.getAttachments).mockReturnValue([])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a legacy document through the FrameConnector, unchanged', async () => {
    render(
      <DocumentRenderer rawDocument={legacyDocument} fileName="legacy.json" />
    )
    expect(screen.getByTestId('frame-connector').dataset.source).toBe(
      fallbackUrl
    )
    expect(screen.queryByTestId('inline-template-renderer')).toBeNull()

    const frame = vi.fn()
    act(() => {
      lastFrameProps().onConnected(frame)
      lastFrameProps().dispatch({
        type: 'UPDATE_TEMPLATES',
        payload: [
          { id: 'bol', label: 'Bill of Lading', type: 'custom-template' },
        ],
      })
    })
    expect(screen.getByTestId('rendered-view')).toHaveTextContent(
      `BILL OF LADING rendered from ${fallbackUrl}`
    )
    expect(screen.getByRole('link', { name: fallbackUrl })).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Print document'))
    expect(framePrint).toHaveBeenCalledTimes(1)
    expect(frame).toHaveBeenCalledWith({ type: 'PRINT' })
  })

  it('renders the inline template instead of the FrameConnector', async () => {
    render(
      <DocumentRenderer rawDocument={inlineDocument} fileName="inline.json" />
    )
    expect(screen.queryByTestId('frame-connector')).toBeNull()
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'BILL OF LADING' })).toBeTruthy()
    )
    expect(getInlineFrame()?.getAttribute('sandbox')).toBe(
      'allow-same-origin allow-modals'
    )
    expect(screen.getByTestId('rendered-view')).toHaveTextContent(
      'BILL OF LADING rendered from Inline Template'
    )
    expect(screen.queryByRole('link', { name: fallbackUrl })).toBeNull()
    expect(screen.queryByTestId('loader')).toBeNull()
    expect(screen.getByLabelText('Download document')).toBeTruthy()
  })

  it("prints the inline template's iframe, not the decentralised renderer", async () => {
    render(
      <DocumentRenderer rawDocument={inlineDocument} fileName="inline.json" />
    )
    await waitFor(() => expect(getInlineFrame()).toBeTruthy())
    await screen.findByLabelText('Print document')
    const frameWindow = getInlineFrame()!.contentWindow as Window
    vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined)
    const inlinePrint = vi
      .spyOn(frameWindow, 'print')
      .mockImplementation(() => undefined)

    fireEvent.click(screen.getByLabelText('Print document'))
    expect(inlinePrint).toHaveBeenCalledTimes(1)
    expect(framePrint).not.toHaveBeenCalled()
  })

  it('falls back to the FrameConnector when the inline template fails to render', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    render(
      <DocumentRenderer
        rawDocument={brokenInlineDocument}
        fileName="broken.json"
      />
    )
    await waitFor(() =>
      expect(screen.getByTestId('frame-connector').dataset.source).toBe(
        fallbackUrl
      )
    )
    expect(screen.queryByTestId('inline-template-renderer')).toBeNull()
  })

  it('tries the inline template again when a new document arrives after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { rerender } = render(
      <DocumentRenderer rawDocument={brokenInlineDocument} fileName="a.json" />
    )
    await waitFor(() =>
      expect(screen.getByTestId('frame-connector')).toBeTruthy()
    )

    rerender(
      <DocumentRenderer rawDocument={inlineDocument} fileName="b.json" />
    )
    await waitFor(() => expect(getInlineFrame()).toBeTruthy())
    expect(screen.queryByTestId('frame-connector')).toBeNull()
  })

  it('switches between the inline template and the attachments tab', async () => {
    vi.mocked(helperModule.getAttachments).mockReturnValue([
      { filename: 'doc.pdf', data: 'base64data', type: 'application/pdf' },
    ])
    render(
      <DocumentRenderer rawDocument={inlineDocument} fileName="inline.json" />
    )
    const documentTab = await screen.findByRole('tab', {
      name: 'BILL OF LADING',
    })
    fireEvent.click(screen.getByRole('tab', { name: /Attachments/ }))
    expect(screen.getByText('doc.pdf')).toBeTruthy()
    fireEvent.click(documentTab)
    expect(screen.queryByText('doc.pdf')).toBeNull()
    expect(documentTab.getAttribute('aria-selected')).toBe('true')
  })
})
