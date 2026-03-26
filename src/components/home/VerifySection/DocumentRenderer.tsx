import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FrameConnector,
  renderDocument,
  selectTemplate,
  print as framePrint,
  FrameActions,
} from '@trustvc/decentralized-renderer-react-components'
import { QRCodeSVG } from 'qrcode.react'
import Spinner from '../../common/Spinner'
import {
  getTemplateSourceUrl,
  getOpenAttestationData,
  getQRCodeLink,
  getAttachments,
  formatFileSize,
  DocumentAttachment,
} from '../../../utils/helper'
import {
  QRCodeIcon,
  PrinterIcon,
  DownloadIcon,
  FileIcon,
} from '../../common/Icons'

interface TemplateTab {
  id: string
  label: string
}

const SCROLLBAR_WIDTH = 20

interface DocumentRendererProps {
  rawDocument: unknown
  fileName: string
}

const DocumentRenderer: React.FC<DocumentRendererProps> = ({
  rawDocument,
  fileName,
}) => {
  const toFrame = useRef<any>()
  const [templates, setTemplates] = useState<TemplateTab[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [rendererHeight, setRendererHeight] = useState(250)
  const [isRendererReady, setIsRendererReady] = useState(false)
  const [qrCodePopover, setQrCodePopover] = useState(false)
  const qrWrapperRef = useRef<HTMLDivElement>(null)

  const document = useMemo(
    () => (rawDocument ? getOpenAttestationData(rawDocument) : undefined),
    [rawDocument]
  )
  const templateSource = useMemo(
    () => (rawDocument ? getTemplateSourceUrl(rawDocument) : undefined),
    [rawDocument]
  )
  const qrCodeUrl = useMemo(
    () => (rawDocument ? getQRCodeLink(rawDocument) : undefined),
    [rawDocument]
  )
  const attachments = useMemo(
    () => (rawDocument ? getAttachments(rawDocument) : []),
    [rawDocument]
  )

  const onConnected = useCallback(
    (frame: any) => {
      toFrame.current = frame
      if (toFrame.current) {
        toFrame.current(
          renderDocument({ document, rawDocument: rawDocument as any })
        )
      }
    },
    [document, rawDocument]
  )

  const handleFrameDispatch = useCallback((action: FrameActions): void => {
    if (action.type === 'UPDATE_HEIGHT') {
      setRendererHeight((action as any).payload + SCROLLBAR_WIDTH)
    }
    if (action.type === 'UPDATE_TEMPLATES') {
      const newTemplates = (action as any).payload as TemplateTab[]
      const filtered = newTemplates.filter(
        (t: any) =>
          t.type === 'custom-template' ||
          t.type === 'application/pdf' ||
          !t.type
      )
      setTemplates(filtered)
      if (filtered.length > 0) {
        setSelectedTemplate(filtered[0].id)
      }
      setIsRendererReady(true)
    }
  }, [])

  useEffect(() => {
    if (toFrame.current && document) {
      toFrame.current(renderDocument({ document }))
    }
  }, [document])

  useEffect(() => {
    if (
      toFrame.current &&
      selectedTemplate &&
      selectedTemplate !== 'attachmentTab'
    ) {
      toFrame.current(selectTemplate(selectedTemplate))
    }
  }, [selectedTemplate])

  useEffect(() => {
    if (!qrCodePopover) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        qrWrapperRef.current &&
        !qrWrapperRef.current.contains(e.target as Node)
      ) {
        setQrCodePopover(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQrCodePopover(false)
      }
    }
    window.document.addEventListener('mousedown', handleClickOutside)
    window.document.addEventListener('keydown', handleEscape)
    return () => {
      window.document.removeEventListener('mousedown', handleClickOutside)
      window.document.removeEventListener('keydown', handleEscape)
    }
  }, [qrCodePopover])

  const handlePrint = () => {
    if (toFrame.current) {
      toFrame.current(framePrint())
    }
  }

  const downloadHref = useMemo(
    () =>
      rawDocument
        ? `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(rawDocument, null, 2))}`
        : undefined,
    [rawDocument]
  )

  if (!templateSource) return null

  return (
    <div className="vr-renderer-wrapper">
      {/* Template tabs — hidden until renderer is ready */}
      <div
        className="vr-template-tabs-wrapper"
        style={{ display: isRendererReady ? undefined : 'none' }}
      >
        <div className="vr-template-tabs" role="tablist">
          {templates.map(({ id, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={id === selectedTemplate}
              className={`vr-template-tab ${id === selectedTemplate ? 'vr-template-tab--active' : ''}`}
              onClick={() => setSelectedTemplate(id)}
            >
              <span>{label}</span>
            </button>
          ))}
          {attachments.length > 0 && (
            <button
              id="tab-attachments"
              role="tab"
              aria-selected={selectedTemplate === 'attachmentTab'}
              className={`vr-template-tab ${selectedTemplate === 'attachmentTab' ? 'vr-template-tab--active' : ''}`}
              onClick={() => setSelectedTemplate('attachmentTab')}
            >
              <span>Attachments</span>
              <span className="vr-attachment-count">{attachments.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className="vr-renderer-section">
        {/* Attachments pane */}
        {selectedTemplate === 'attachmentTab' && (
          <div
            id="tabpanel-attachments"
            role="tabpanel"
            aria-labelledby="tab-attachments"
            tabIndex={0}
          >
            <AttachmentsPane attachments={attachments} />
          </div>
        )}

        {/* Document utility toolbar */}
        {templates.length > 0 && selectedTemplate !== 'attachmentTab' && (
          <div className="vr-doc-utility">
            <div className="vr-doc-utility-wrap">
              {selectedTemplate && selectedTemplate !== 'default-template' && (
                <div className="vr-doc-utility-info">
                  <div className="vr-doc-utility-label">Rendered View:</div>
                  <div className="vr-doc-utility-detail">
                    {(
                      templates.find(t => t.id === selectedTemplate)?.label ??
                      selectedTemplate
                    )
                      .trim()
                      .toUpperCase()}{' '}
                    rendered from{' '}
                    <a
                      href={templateSource}
                      className="vr-doc-utility-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {templateSource}
                    </a>
                  </div>
                </div>
              )}
              <div className="vr-doc-utility-actions">
                {qrCodeUrl && (
                  <div className="vr-doc-utility-qr-wrapper" ref={qrWrapperRef}>
                    <button
                      type="button"
                      className="vr-doc-utility-btn"
                      aria-label="Show QR code"
                      aria-expanded={qrCodePopover}
                      onClick={() => setQrCodePopover(!qrCodePopover)}
                    >
                      <div className="vr-doc-utility-btn-boundary">
                        <QRCodeIcon />
                      </div>
                    </button>
                    {qrCodePopover && (
                      <div className="vr-qr-popover">
                        <QRCodeSVG
                          value={qrCodeUrl}
                          level="H"
                          size={200}
                          bgColor="#FFFFFF"
                          fgColor="#000000"
                          imageSettings={{
                            src: '/icons/trustvc-logo.svg',
                            x: undefined,
                            y: undefined,
                            height: 24,
                            width: 58,
                            excavate: true,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                <button
                  type="button"
                  className="vr-doc-utility-btn"
                  aria-label="Print document"
                  onClick={handlePrint}
                >
                  <div className="vr-doc-utility-btn-boundary">
                    <PrinterIcon />
                  </div>
                </button>
                {downloadHref && (
                  <a
                    download={fileName || 'document'}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={downloadHref}
                    className="vr-doc-utility-btn"
                    aria-label="Download document"
                  >
                    <div className="vr-doc-utility-btn-boundary">
                      <DownloadIcon />
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {!isRendererReady && selectedTemplate !== 'attachmentTab' && (
          <div className="vr-renderer-loading">
            <Spinner
              label="Loading document preview..."
              size="medium"
              centered
            />
          </div>
        )}

        {/* Renderer iframe */}
        <div
          id="tabpanel-renderer"
          role="tabpanel"
          aria-labelledby={
            selectedTemplate ? `tab-${selectedTemplate}` : undefined
          }
          tabIndex={0}
          className="vr-renderer-frame"
          style={{
            display: selectedTemplate === 'attachmentTab' ? 'none' : undefined,
            opacity: isRendererReady ? 1 : 0,
            height: isRendererReady ? undefined : 0,
            overflow: isRendererReady ? undefined : 'hidden',
          }}
        >
          <FrameConnector
            style={{
              height: `${rendererHeight}px`,
              width: '100%',
              border: '0px',
            }}
            source={templateSource}
            dispatch={handleFrameDispatch}
            onConnected={onConnected}
            useFallbackRenderer={true}
          />
        </div>
      </div>
    </div>
  )
}

// ── Attachments sub-component ──

const SAFE_MIME_TYPES = new Set([
  'application/pdf',
  'application/json',
  'application/xml',
  'application/octet-stream',
  'image/png',
  'image/jpeg',
  'image/gif',
  'text/plain',
  'text/csv',
  'text/xml',
])

const getSafeDownloadHref = (type: string, data: string): string => {
  const mimeType = SAFE_MIME_TYPES.has(type) ? type : 'application/octet-stream'
  return `data:${mimeType};base64,${data}`
}

const AttachmentsPane: React.FC<{ attachments: DocumentAttachment[] }> = ({
  attachments,
}) => (
  <div className="vr-attachments-pane">
    {attachments.map((att, idx) => (
      <div
        key={`${idx}-${att.filename}-${att.type}`}
        className="vr-attachment-tile"
      >
        <div className="vr-attachment-icon">
          <FileIcon filename={att.filename} type={att.type} />
        </div>
        <div className="vr-attachment-info">
          <span className="vr-attachment-name">{att.filename}</span>
          <span className="vr-attachment-type">
            {att.type}
            {att.data ? ` · ${formatFileSize(att.data)}` : ''}
          </span>
        </div>
        <a
          href={getSafeDownloadHref(att.type, att.data)}
          download={att.filename}
          className="vr-attachment-download"
          aria-label={`Download ${att.filename}`}
        >
          <DownloadIcon />
        </a>
      </div>
    ))}
  </div>
)

export default DocumentRenderer
