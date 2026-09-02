import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../__tests__/test-utils'
import userEvent from '@testing-library/user-event'
import { verifyDocument, type VerificationFragment } from '@trustvc/trustvc'
import WrapUnwrapTool from './WrapUnwrapTool'
import {
  INVALID_JSON_MESSAGE,
  SAMPLE_RAW_V2_DOCUMENT,
  SAMPLE_RAW_V4_DOCUMENT,
} from '@/utils/toolkit/types'
import {
  OA_UNSUPPORTED_VERSION_MESSAGE,
  wrapRawDocument,
} from '@/utils/toolkit/wrap'
import credentialExpiredVp from '../../__tests__/__fixtures__/w3c/presentations/invalid/credential_expired.json'
import oaDnsTxtDocstoreV3 from '../../__tests__/__fixtures__/oa/3.0/signed_wrapped_oa_dns_txt_docstore_v3.json'

vi.mock('@/utils/toolkit/wrap', async () => {
  const actual = await vi.importActual<typeof import('@/utils/toolkit/wrap')>(
    '@/utils/toolkit/wrap'
  )
  return {
    ...actual,
    wrapRawDocument: vi.fn(actual.wrapRawDocument),
  }
})

const pasteJson = async (
  user: ReturnType<typeof userEvent.setup>,
  value: unknown
) => {
  await user.click(screen.getByRole('textbox', { name: 'RAW JSON' }))
  await user.paste(JSON.stringify(value))
}

const verifierReasonMessages = (fragments: VerificationFragment[]) =>
  fragments.flatMap(fragment => {
    const reason = (fragment as { reason?: { message?: string } }).reason
    return reason?.message ? [reason.message] : []
  })

describe('WrapUnwrapTool', () => {
  it('shows a graceful error for non-JSON input', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await user.type(
      screen.getByPlaceholderText(/paste document json here/i),
      'not-json'
    )
    await user.click(screen.getByLabelText('Wrap document'))
    expect(await screen.findByText(INVALID_JSON_MESSAGE)).toBeInTheDocument()
  })

  it('swaps pane labels and placeholders when switching to unwrap', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    expect(
      screen.getByRole('textbox', { name: 'RAW JSON' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'WRAPPED DOCUMENT' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /^unwrap$/i }))
    expect(
      screen.getByPlaceholderText(/paste a wrapped document json here/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'WRAPPED DOCUMENT' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'RAW JSON' })
    ).toBeInTheDocument()
  })

  it('does not render raw verifier wording from a failing document', async () => {
    const fragments = (await verifyDocument(
      credentialExpiredVp as never
    )) as VerificationFragment[]
    const rawReasons = verifierReasonMessages(fragments)
    expect(rawReasons.length).toBeGreaterThan(0)

    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await pasteJson(user, credentialExpiredVp)
    await user.click(screen.getByLabelText('Wrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(
      'Document is not a valid OpenAttestation certificate.'
    )
    expect(status.textContent).not.toMatch(
      /validUntil|did:key:|Cannot read properties/
    )
    for (const reason of rawReasons) {
      expect(status).not.toHaveTextContent(reason)
    }
  })

  it('lists diagnose keyword - message when wrapping a schema-invalid raw document', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await pasteJson(user, {
      ...SAMPLE_RAW_V2_DOCUMENT,
      issuers: [
        {
          ...SAMPLE_RAW_V2_DOCUMENT.issuers[0],
          identityProof: {
            type: 'NOT-A-PROOF',
            location: 'example.openattestation.com',
          },
        },
      ],
    })
    await user.click(screen.getByLabelText('Wrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/Document is not valid:/)
    expect(status).toHaveTextContent(/ - /)
  })

  it('lists diagnose keyword - message when unwrapping a raw document', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await user.click(screen.getByRole('tab', { name: /^unwrap$/i }))
    await user.click(screen.getByRole('textbox', { name: 'WRAPPED DOCUMENT' }))
    await user.paste(JSON.stringify(SAMPLE_RAW_V2_DOCUMENT))
    await user.click(screen.getByLabelText('Unwrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/Document is not valid:/)
    expect(status).toHaveTextContent(/ - /)
  })

  it('shows a fixed message when wrap throws', async () => {
    vi.mocked(wrapRawDocument).mockRejectedValueOnce(
      new Error("Cannot read properties of null (reading 'verificationMethod')")
    )
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await pasteJson(user, SAMPLE_RAW_V2_DOCUMENT)
    await user.click(screen.getByLabelText('Wrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Unable to process this document.')
    expect(status).not.toHaveTextContent(/Cannot read properties/)
  })

  it('wraps a v3 document', async () => {
    const { proof: _proof, ...rawV3 } = oaDnsTxtDocstoreV3
    vi.mocked(wrapRawDocument).mockResolvedValueOnce({
      ...rawV3,
      proof: {
        type: 'OpenAttestationMerkleProofSignature2018',
        merkleRoot: 'abc',
      },
    })
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await pasteJson(user, rawV3)
    await user.click(screen.getByLabelText('Wrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Document wrapped successfully.')
    expect(
      (
        screen.getByRole('textbox', {
          name: 'WRAPPED DOCUMENT',
        }) as HTMLTextAreaElement
      ).value
    ).toContain('OpenAttestationMerkleProofSignature2018')
  })

  it('shows the TrustVC unsupported-version message when wrapping a v4 document', async () => {
    const user = userEvent.setup()
    render(<WrapUnwrapTool isDarkMode={false} />)
    await pasteJson(user, SAMPLE_RAW_V4_DOCUMENT)
    await user.click(screen.getByLabelText('Wrap document'))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(OA_UNSUPPORTED_VERSION_MESSAGE)
  })
})
