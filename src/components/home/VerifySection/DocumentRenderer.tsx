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
  }, [document, toFrame])

  useEffect(() => {
    if (
      toFrame.current &&
      selectedTemplate &&
      selectedTemplate !== 'attachmentTab'
    ) {
      toFrame.current(selectTemplate(selectedTemplate))
    }
  }, [selectedTemplate, toFrame])

  const handlePrint = () => {
    if (toFrame.current) {
      toFrame.current(framePrint())
    }
  }

  const downloadHref = rawDocument
    ? `data:text/json;,${encodeURIComponent(JSON.stringify(rawDocument, null, 2))}`
    : undefined

  if (!templateSource) return null

  return (
    <div className="vr-renderer-wrapper">
      {/* Template tabs — hidden until renderer is ready */}
      <div
        className="vr-template-tabs-wrapper"
        style={{ display: isRendererReady ? undefined : 'none' }}
      >
        <div className="vr-template-tabs">
          {templates.map(({ id, label }) => (
            <div
              key={id}
              className={`vr-template-tab ${id === selectedTemplate ? 'vr-template-tab--active' : ''}`}
              onClick={() => setSelectedTemplate(id)}
            >
              <span className="vr-template-tab-label">{label}</span>
            </div>
          ))}
          {attachments.length > 0 && (
            <div
              className={`vr-template-tab ${selectedTemplate === 'attachmentTab' ? 'vr-template-tab--active' : ''}`}
              onClick={() => setSelectedTemplate('attachmentTab')}
            >
              <span className="vr-template-tab-label">Attachments</span>
              <span className="vr-attachment-count">{attachments.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className="vr-renderer-section">
        {/* Attachments pane */}
        {selectedTemplate === 'attachmentTab' && (
          <AttachmentsPane attachments={attachments} />
        )}

        {/* Document utility toolbar */}
        {templates.length > 0 && selectedTemplate !== 'attachmentTab' && (
          <div className="vr-doc-utility">
            <div className="vr-doc-utility-wrap">
              {selectedTemplate && selectedTemplate !== 'default-template' && (
                <div className="vr-doc-utility-info">
                  <div className="vr-doc-utility-label">Rendered View:</div>
                  <div className="vr-doc-utility-detail">
                    {selectedTemplate.trim().toUpperCase()} rendered from{' '}
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
                  <div className="vr-doc-utility-qr-wrapper">
                    <div
                      className="vr-doc-utility-btn"
                      onClick={() => setQrCodePopover(!qrCodePopover)}
                    >
                      <div className="vr-doc-utility-btn-boundary">
                        <QRCodeIcon />
                      </div>
                    </div>
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
                <div className="vr-doc-utility-btn" onClick={handlePrint}>
                  <div className="vr-doc-utility-btn-boundary">
                    <PrinterIcon />
                  </div>
                </div>
                {downloadHref && (
                  <a
                    download={`${fileName || 'document'}.tt`}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={downloadHref}
                    className="vr-doc-utility-btn"
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

const AttachmentsPane: React.FC<{ attachments: DocumentAttachment[] }> = ({
  attachments,
}) => (
  <div className="vr-attachments-pane">
    {attachments.map((att, idx) => (
      <div key={idx} className="vr-attachment-tile">
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
          href={`data:${att.type};base64,${att.data}`}
          download={att.filename}
          className="vr-attachment-download"
        >
          <DownloadIcon />
        </a>
      </div>
    ))}
  </div>
)

export default DocumentRenderer
