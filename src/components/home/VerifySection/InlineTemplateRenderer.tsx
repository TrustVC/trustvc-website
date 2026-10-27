import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import {
  decompressInlineHtmlTemplate,
  getRenderMethods,
  printInlineHtmlTemplate,
  renderInlineHtmlTemplate,
} from '@trustvc/trustvc'

export interface InlineTemplateRendererHandle {
  print: () => void
}

interface InlineTemplateRendererProps {
  rawDocument: unknown
  /** Called with the template's name once it has rendered. */
  onRendered?: (templateName: string | undefined) => void
  /** Called when the template can't be decompressed or rendered, so the caller can fall back. */
  onFailure?: () => void
}

/**
 * Renders a credential's own INLINE_HTML_TEMPLATE renderMethod entry. The template is
 * issuer-controlled HTML, so it never reaches this page's DOM: trustvc's renderInlineTemplate
 * fills it against credentialSubject and mounts it in a sandboxed srcdoc iframe inside the
 * host. Its ref exposes print(), which prints only that iframe.
 */
const InlineTemplateRenderer = forwardRef<
  InlineTemplateRendererHandle,
  InlineTemplateRendererProps
>(({ rawDocument, onRendered, onFailure }, ref) => {
  const hostRef = useRef<HTMLDivElement>(null)
  // Kept in refs so a new callback identity from the parent doesn't re-run the render effect.
  const onRenderedRef = useRef(onRendered)
  const onFailureRef = useRef(onFailure)
  onRenderedRef.current = onRendered
  onFailureRef.current = onFailure

  useImperativeHandle(ref, () => ({
    print: () => {
      if (hostRef.current) printInlineHtmlTemplate(hostRef.current)
    },
  }))

  useEffect(() => {
    let cancelled = false
    // A string `template` is gzipped (it is signed in that form), so inflate it first.
    decompressInlineHtmlTemplate(rawDocument)
      .then(decompressed => {
        if (cancelled || !hostRef.current) return
        if (!renderInlineHtmlTemplate(decompressed, hostRef.current)) {
          throw new Error('No renderable INLINE_HTML_TEMPLATE entry')
        }
        const template =
          getRenderMethods(decompressed).inlineHtmlTemplate?.template
        onRenderedRef.current?.(
          typeof template === 'object' ? template.templateName : undefined
        )
      })
      .catch(error => {
        if (cancelled) return
        console.error('Failed to render inline template', error)
        onFailureRef.current?.()
      })
    return () => {
      cancelled = true
    }
  }, [rawDocument])

  return (
    <div className="vr-inline-template-frame">
      <div ref={hostRef} data-testid="inline-template-renderer" />
    </div>
  )
})

InlineTemplateRenderer.displayName = 'InlineTemplateRenderer'

export default InlineTemplateRenderer
