import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { compressTemplate } from '@trustvc/trustvc'
import InlineTemplateRenderer, {
  InlineTemplateRendererHandle,
} from './InlineTemplateRenderer'
import { hasInlineTemplate } from '../../../utils/helper'

const template = {
  templateName: 'BILL_OF_LADING',
  html: `
    <div class="bol">
      <div data-field="blNumber"></div>
      <table><tbody>
        <template data-repeat="packages">
          <tr><td data-field="packagesDescription"></td></tr>
        </template>
      </tbody></table>
    </div>
  `,
  css: '.bol { color: red; }',
}

const credentialSubject = {
  blNumber: 'SGCNM21566325',
  packages: [
    { packagesDescription: '1 container' },
    { packagesDescription: '2nd container' },
  ],
}

const inlineDocument = {
  renderMethod: [
    { type: 'INLINE_HTML_TEMPLATE', template },
    {
      id: 'https://generic-templates.tradetrust.io',
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_LADING',
    },
  ],
  credentialSubject,
}

const getFrame = () =>
  screen.getByTestId('inline-template-renderer').querySelector('iframe')

// jsdom doesn't load srcdoc frames, so assert on the srcdoc the frame was given.
const frameDocument = (frame: HTMLIFrameElement) =>
  new DOMParser().parseFromString(frame.srcdoc, 'text/html')

describe('hasInlineTemplate', () => {
  it('is true only when the document has an INLINE_HTML_TEMPLATE entry', () => {
    expect(hasInlineTemplate(inlineDocument)).toBe(true)
    expect(
      hasInlineTemplate({
        renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }],
      })
    ).toBe(false)
    expect(hasInlineTemplate({})).toBe(false)
    expect(hasInlineTemplate(undefined)).toBe(false)
  })
})

describe('InlineTemplateRenderer', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fills the template from credentialSubject inside a sandboxed iframe', async () => {
    const onRendered = vi.fn()
    render(
      <InlineTemplateRenderer
        rawDocument={inlineDocument}
        onRendered={onRendered}
      />
    )
    await waitFor(() => expect(getFrame()).not.toBeNull())
    const frame = getFrame() as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-same-origin allow-modals')
    const doc = frameDocument(frame)
    expect(doc.querySelector('[data-field="blNumber"]')?.textContent).toBe(
      'SGCNM21566325'
    )
    expect(doc.querySelectorAll('tr')).toHaveLength(2)
    expect(
      Array.from(doc.querySelectorAll('style')).map(s => s.textContent)
    ).toContain(template.css)
    expect(onRendered).toHaveBeenCalledWith('BILL_OF_LADING')
  })

  it('renders a gzipped template', async () => {
    // jsdom's Blob has no stream(), which trustvc's gzip helpers need (browsers and Node have
    // it). This stand-in only adds stream(); the real (Node) CompressionStream /
    // DecompressionStream still do the gzip work.
    class StreamableBlob {
      constructor(private parts: Uint8Array[]) {}
      stream() {
        const { parts } = this
        return new ReadableStream<Uint8Array>({
          start(controller) {
            parts.forEach(part => controller.enqueue(part))
            controller.close()
          },
        })
      }
    }
    vi.stubGlobal('Blob', StreamableBlob)
    const compressed = {
      ...inlineDocument,
      renderMethod: [
        {
          type: 'INLINE_HTML_TEMPLATE',
          template: await compressTemplate(template),
        },
        inlineDocument.renderMethod[1],
      ],
    }
    const onRendered = vi.fn()
    render(
      <InlineTemplateRenderer
        rawDocument={compressed}
        onRendered={onRendered}
      />
    )
    await waitFor(() =>
      expect(onRendered).toHaveBeenCalledWith('BILL_OF_LADING')
    )
    const doc = frameDocument(getFrame() as HTMLIFrameElement)
    expect(doc.querySelector('[data-field="blNumber"]')?.textContent).toBe(
      'SGCNM21566325'
    )
  })

  it("does not put the template's markup or CSS into the page's DOM", async () => {
    render(<InlineTemplateRenderer rawDocument={inlineDocument} />)
    await waitFor(() => expect(getFrame()).not.toBeNull())
    const host = screen.getByTestId('inline-template-renderer')
    expect(host.shadowRoot).toBeNull()
    expect(host.children).toHaveLength(1)
    expect(document.querySelector('.bol')).toBeNull()
    expect(host.textContent).toBe('')
  })

  it('calls onFailure, not onRendered, when the template cannot be decompressed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onRendered = vi.fn()
    const onFailure = vi.fn()
    render(
      <InlineTemplateRenderer
        rawDocument={{
          renderMethod: [
            { type: 'INLINE_HTML_TEMPLATE', template: 'not-gzip' },
          ],
          credentialSubject: {},
        }}
        onRendered={onRendered}
        onFailure={onFailure}
      />
    )
    await waitFor(() => expect(onFailure).toHaveBeenCalledTimes(1))
    expect(onRendered).not.toHaveBeenCalled()
    expect(getFrame()).toBeNull()
  })

  it('calls onFailure when the document has no renderable inline entry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onFailure = vi.fn()
    render(
      <InlineTemplateRenderer
        rawDocument={{ renderMethod: [] }}
        onFailure={onFailure}
      />
    )
    await waitFor(() => expect(onFailure).toHaveBeenCalledTimes(1))
  })

  it('does not call onFailure when the template renders', async () => {
    const onFailure = vi.fn()
    render(
      <InlineTemplateRenderer
        rawDocument={inlineDocument}
        onFailure={onFailure}
      />
    )
    await waitFor(() => expect(getFrame()).not.toBeNull())
    expect(onFailure).not.toHaveBeenCalled()
  })

  it("prints the template's iframe through its ref", async () => {
    const ref = React.createRef<InlineTemplateRendererHandle>()
    render(<InlineTemplateRenderer rawDocument={inlineDocument} ref={ref} />)
    await waitFor(() => expect(getFrame()).not.toBeNull())
    const frameWindow = (getFrame() as HTMLIFrameElement)
      .contentWindow as Window
    vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined)
    const framePrint = vi
      .spyOn(frameWindow, 'print')
      .mockImplementation(() => undefined)
    const pagePrint = vi.spyOn(window, 'print').mockImplementation(() => {})
    ref.current?.print()
    expect(framePrint).toHaveBeenCalledTimes(1)
    expect(pagePrint).not.toHaveBeenCalled()
  })
})
