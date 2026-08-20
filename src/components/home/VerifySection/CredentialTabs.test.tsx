import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CredentialTabs from './CredentialTabs'

// The real renderer mounts an iframe against a remote template, which jsdom cannot do.
// Stand in for it and report which credential it was handed.
vi.mock('./useCredentialVerification', () => ({
  useCredentialVerification: (credentials: unknown[]) =>
    credentials.map((_c, i) => ({
      loading: false,
      // The second credential fails, so the per-tab status icons differ.
      status: {
        DOCUMENT_STATUS: i === 1 ? 'INVALID' : 'VALID',
        ISSUER_IDENTITY: 'VALID',
        DOCUMENT_INTEGRITY: 'VALID',
      },
      issuer: `did:web:issuer-${i}.example.com`,
      isValid: i !== 1,
    })),
}))

// Every document the renderer is handed, in render order. The out-of-bounds regression is
// only visible for a single render, which act() flushes past before assertions run — so it
// has to be recorded as it happens rather than read off the DOM afterwards.
const { renderedDocuments } = vi.hoisted(() => ({
  renderedDocuments: [] as unknown[],
}))

vi.mock('./DocumentRenderer', () => ({
  default: ({ rawDocument }: { rawDocument: any }) => {
    renderedDocuments.push(rawDocument)
    return (
      <div data-testid="document-renderer">
        {rawDocument?.renderMethod?.[0]?.templateName ?? 'no-template'}
      </div>
    )
  },
}))

const credential = (templateName: string, id: string) => ({
  id,
  type: ['VerifiableCredential'],
  renderMethod: [{ type: 'EMBEDDED_RENDERER', templateName }],
  credentialSubject: { id: 'did:key:zHolder' },
})

const presentation = (...credentials: unknown[]) => ({
  type: ['VerifiablePresentation'],
  holder: 'did:key:zHolder',
  verifiableCredential: credentials,
})

describe('CredentialTabs', () => {
  it('renders one tab per embedded credential', () => {
    render(
      <CredentialTabs
        presentation={presentation(
          credential('CHAFTA_COO', 'urn:1'),
          credential('BILL_OF_LADING', 'urn:2')
        )}
        fileName="vp.json"
      />
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0]).toHaveTextContent('CHAFTA COO')
    expect(tabs[1]).toHaveTextContent('BILL OF LADING')
  })

  it('shows the first credential by default and marks its tab selected', () => {
    render(
      <CredentialTabs
        presentation={presentation(
          credential('CHAFTA_COO', 'urn:1'),
          credential('BILL_OF_LADING', 'urn:2')
        )}
        fileName="vp.json"
      />
    )

    expect(screen.getByTestId('document-renderer')).toHaveTextContent(
      'CHAFTA_COO'
    )
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('renders the other credential when its tab is clicked', async () => {
    const user = userEvent.setup()
    render(
      <CredentialTabs
        presentation={presentation(
          credential('CHAFTA_COO', 'urn:1'),
          credential('BILL_OF_LADING', 'urn:2')
        )}
        fileName="vp.json"
      />
    )

    await user.click(screen.getByRole('tab', { name: 'BILL OF LADING' }))

    expect(screen.getByTestId('document-renderer')).toHaveTextContent(
      'BILL_OF_LADING'
    )
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
      'aria-selected',
      'false'
    )
  })

  it('still shows a tab for a single credential, since it labels the panel', () => {
    render(
      <CredentialTabs
        presentation={presentation(credential('CHAFTA_COO', 'urn:1'))}
        fileName="vp.json"
      />
    )

    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByTestId('document-renderer')).toHaveTextContent(
      'CHAFTA_COO'
    )
  })

  it('accepts verifiableCredential as a single object, not only an array', () => {
    render(
      <CredentialTabs
        presentation={{
          type: ['VerifiablePresentation'],
          verifiableCredential: credential('CHAFTA_COO', 'urn:1'),
        }}
        fileName="vp.json"
      />
    )

    expect(screen.getByTestId('document-renderer')).toHaveTextContent(
      'CHAFTA_COO'
    )
  })

  it('renders nothing when the presentation holds no credentials', () => {
    const { container } = render(
      <CredentialTabs presentation={presentation()} fileName="vp.json" />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('falls back to the credential type, then a position, when there is no template', () => {
    render(
      <CredentialTabs
        presentation={presentation(
          { type: ['VerifiableCredential', 'BillOfLading'], id: 'urn:1' },
          { type: ['VerifiableCredential'], id: 'urn:2' }
        )}
        fileName="vp.json"
      />
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveTextContent('BillOfLading')
    expect(tabs[1]).toHaveTextContent('Credential 2')
  })

  it('resets to the first tab when a different presentation is loaded', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <CredentialTabs
        presentation={presentation(
          credential('CHAFTA_COO', 'urn:1'),
          credential('BILL_OF_LADING', 'urn:2')
        )}
        fileName="vp.json"
      />
    )
    await user.click(screen.getByRole('tab', { name: 'BILL OF LADING' }))
    expect(screen.getByTestId('document-renderer')).toHaveTextContent(
      'BILL_OF_LADING'
    )

    // A shorter presentation: without the reset the stale index would point past the end.
    rerender(
      <CredentialTabs
        presentation={presentation(
          credential('INVOICE', 'urn:3'),
          credential('COO', 'urn:4')
        )}
        fileName="vp2.json"
      />
    )

    expect(screen.getByTestId('document-renderer')).toHaveTextContent('INVOICE')
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('never renders a credential past the end of a shorter presentation', async () => {
    // Regression: the reset lived in an effect, which runs after paint. A presentation with
    // fewer credentials than the last was therefore rendered once with the stale index still
    // in place, handing the panel an undefined credential — a tab labelled from nothing, a
    // version tag defaulted to V1.1, and the renderer given no document at all.
    const user = userEvent.setup()
    const { rerender } = render(
      <CredentialTabs
        presentation={presentation(
          credential('CHAFTA_COO', 'urn:1'),
          credential('BILL_OF_LADING', 'urn:2')
        )}
        fileName="vp.json"
      />
    )
    await user.click(screen.getByRole('tab', { name: 'BILL OF LADING' }))

    // A single credential, so the retained index of 1 is now past the end.
    renderedDocuments.length = 0
    rerender(
      <CredentialTabs
        presentation={presentation(credential('INVOICE', 'urn:3'))}
        fileName="vp2.json"
      />
    )

    expect(renderedDocuments.length).toBeGreaterThan(0)
    expect(renderedDocuments).not.toContain(undefined)
    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.getByTestId('document-renderer')).toHaveTextContent('INVOICE')
  })

  describe('keyboard navigation', () => {
    const threeCredentials = () =>
      presentation(
        credential('CHAFTA_COO', 'urn:1'),
        credential('BILL_OF_LADING', 'urn:2'),
        credential('INVOICE', 'urn:3')
      )

    const renderTabs = () => {
      render(
        <CredentialTabs presentation={threeCredentials()} fileName="vp.json" />
      )
      const tabs = screen.getAllByRole('tab')
      tabs[0].focus()
      return tabs
    }

    const expectSelected = (tabs: HTMLElement[], index: number) => {
      expect(tabs[index]).toHaveAttribute('aria-selected', 'true')
      expect(tabs[index]).toHaveFocus()
    }

    it('moves with the arrow keys, following focus', async () => {
      const user = userEvent.setup()
      const tabs = renderTabs()

      await user.keyboard('{ArrowRight}')
      expectSelected(tabs, 1)

      await user.keyboard('{ArrowLeft}')
      expectSelected(tabs, 0)
    })

    it('wraps around at both ends', async () => {
      const user = userEvent.setup()
      const tabs = renderTabs()

      // Left from the first lands on the last, and right from there comes back.
      await user.keyboard('{ArrowLeft}')
      expectSelected(tabs, 2)

      await user.keyboard('{ArrowRight}')
      expectSelected(tabs, 0)
    })

    it('jumps to the first and last tab with Home and End', async () => {
      const user = userEvent.setup()
      const tabs = renderTabs()

      await user.keyboard('{End}')
      expectSelected(tabs, 2)

      await user.keyboard('{Home}')
      expectSelected(tabs, 0)
    })

    it('keeps the whole strip to one tab stop', async () => {
      const user = userEvent.setup()
      const tabs = renderTabs()

      expect(tabs[0]).toHaveAttribute('tabindex', '0')
      expect(tabs[1]).toHaveAttribute('tabindex', '-1')
      expect(tabs[2]).toHaveAttribute('tabindex', '-1')

      // The roving index follows the selection, so Tab leaves the strip.
      await user.keyboard('{ArrowRight}')
      expect(tabs[0]).toHaveAttribute('tabindex', '-1')
      expect(tabs[1]).toHaveAttribute('tabindex', '0')
    })

    it('leaves other keys to the browser', async () => {
      const user = userEvent.setup()
      const tabs = renderTabs()

      await user.keyboard('{ArrowDown}')
      expectSelected(tabs, 0)
    })
  })
  describe('per-credential panel', () => {
    const twoCredentials = () =>
      presentation(
        credential('CHAFTA_COO', 'urn:1'),
        credential('BILL_OF_LADING', 'urn:2')
      )

    it('captions the tab strip', () => {
      render(
        <CredentialTabs presentation={twoCredentials()} fileName="vp.json" />
      )
      expect(
        screen.getByText('Credentials in this presentation')
      ).toBeInTheDocument()
    })

    it("shows the selected credential's own issuer, not the presentation holder", () => {
      render(
        <CredentialTabs presentation={twoCredentials()} fileName="vp.json" />
      )

      expect(screen.getByText('Issued by:')).toBeInTheDocument()
      expect(
        screen.getByText('did:web:issuer-0.example.com')
      ).toBeInTheDocument()
    })

    it("swaps to the other credential's issuer when its tab is selected", async () => {
      const user = userEvent.setup()
      render(
        <CredentialTabs presentation={twoCredentials()} fileName="vp.json" />
      )

      await user.click(screen.getByRole('tab', { name: /BILL OF LADING/ }))

      expect(
        screen.getByText('did:web:issuer-1.example.com')
      ).toBeInTheDocument()
    })

    it('shows all three checks for the selected credential', () => {
      render(
        <CredentialTabs presentation={twoCredentials()} fileName="vp.json" />
      )

      expect(screen.getByText('Document has been issued')).toBeInTheDocument()
      expect(
        screen.getByText("Document's issuer has been identified")
      ).toBeInTheDocument()
      expect(
        screen.getByText('Document has not been tampered with')
      ).toBeInTheDocument()
    })

    it("reflects the selected credential's own verdict per check", async () => {
      const user = userEvent.setup()
      render(
        <CredentialTabs presentation={twoCredentials()} fileName="vp.json" />
      )

      // First credential passes everything.
      expect(
        screen.getByTestId('credential-check-document_status')
      ).toHaveAttribute('data-status', 'VALID')

      // The second fails its status check only.
      await user.click(screen.getByRole('tab', { name: /BILL OF LADING/ }))
      expect(
        screen.getByTestId('credential-check-document_status')
      ).toHaveAttribute('data-status', 'INVALID')
      expect(
        screen.getByTestId('credential-check-document_integrity')
      ).toHaveAttribute('data-status', 'VALID')
    })
  })
})
