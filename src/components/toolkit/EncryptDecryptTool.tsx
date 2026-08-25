import { useEffect, useState } from 'react'
import clsx from 'clsx'
import ModeToggle from './ModeToggle'
import DualJsonPanes from './DualJsonPanes'
import StatusNote from './StatusNote'
import { SAMPLE_RAW_V2_DOCUMENT } from '@/utils/toolkit/types'
import {
  decryptDocument,
  encryptDocument,
  generateEncryptionKey,
  loadEncryptedFromActionUrl,
} from '@/utils/toolkit/encrypt'

type EncryptDecryptToolProps = {
  isDarkMode: boolean
  sampleTick?: number
}

const EncryptDecryptTool = ({
  isDarkMode,
  sampleTick = 0,
}: EncryptDecryptToolProps) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [key, setKey] = useState(() => generateEncryptionKey())
  const [rawDocument, setRawDocument] = useState('')
  const [encryptedDocument, setEncryptedDocument] = useState('')
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  useEffect(() => {
    if (sampleTick === 0) return
    setRawDocument(JSON.stringify(SAMPLE_RAW_V2_DOCUMENT, null, 2))
    setEncryptedDocument('')
    setMode('encrypt')
    setStatus(null)
  }, [sampleTick])

  const run = () => {
    setStatus(null)
    try {
      if (mode === 'encrypt') {
        const encrypted = encryptDocument(rawDocument, key)
        setEncryptedDocument(JSON.stringify(encrypted, undefined, 2))
        setStatus({
          kind: 'success',
          message: 'Document encrypted successfully.',
        })
        return
      }
      const decrypted = decryptDocument(encryptedDocument, key)
      setRawDocument(decrypted)
      const parsed = JSON.parse(encryptedDocument) as { key?: string }
      if (parsed.key) setKey(parsed.key)
      setStatus({
        kind: 'success',
        message: 'Document decrypted successfully.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to process document.',
      })
    }
  }

  const loadFromUrl = async () => {
    setStatus(null)
    try {
      const loaded = await loadEncryptedFromActionUrl(url)
      setKey(loaded.key)
      setEncryptedDocument(JSON.stringify(loaded.payload, undefined, 2))
      setRawDocument('')
      setMode('decrypt')
      setStatus({
        kind: 'success',
        message: 'Encrypted document loaded from action URL.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load document from URL.',
      })
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <ModeToggle
          value={mode}
          options={[
            { id: 'encrypt', label: 'Encrypt' },
            { id: 'decrypt', label: 'Decrypt' },
          ]}
          onChange={next => {
            setMode(next)
            setStatus(null)
          }}
          isDarkMode={isDarkMode}
        />
        <input
          id="toolkit-encrypt-key"
          value={key}
          onChange={event => setKey(event.target.value)}
          aria-label="Key"
          placeholder="tvc-preview-key"
          className={clsx(
            'flex-1 min-w-0 h-10 px-3 rounded-lg border font-mono text-xs',
            isDarkMode
              ? 'bg-transparent border-white/20 text-neutral-60'
              : 'bg-white border-neutral-50 text-neutral-10'
          )}
        />
      </div>

      {mode === 'decrypt' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <label
            htmlFor="toolkit-encrypt-url"
            className={clsx(
              'shrink-0 font-urbanist font-bold text-sm',
              isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
            )}
          >
            URL
          </label>
          <input
            id="toolkit-encrypt-url"
            value={url}
            onChange={event => setUrl(event.target.value)}
            placeholder="Paste an action URL with ?q= and #key"
            className={clsx(
              'flex-1 h-10 px-3 rounded-lg border font-mono text-xs',
              isDarkMode
                ? 'bg-transparent border-white/20 text-neutral-60'
                : 'bg-white border-neutral-50 text-neutral-10'
            )}
          />
          <button
            type="button"
            onClick={() => void loadFromUrl()}
            className="h-10 px-4 rounded-lg font-urbanist font-bold text-sm text-white bg-gradient-to-r from-primary-60 to-secondary-60"
          >
            Load
          </button>
        </div>
      )}

      <DualJsonPanes
        isDarkMode={isDarkMode}
        onRun={run}
        runLabel={mode === 'encrypt' ? 'Encrypt document' : 'Decrypt document'}
        left={{
          id: 'toolkit-encrypt-raw',
          label: 'Document JSON',
          value: rawDocument,
          onChange: setRawDocument,
          placeholder:
            mode === 'encrypt'
              ? 'Paste document JSON here, e.g. {"bolNumber" : "BOL - 88213" , "Cargo" : "Refined Copper"}'
              : 'Output will appear here after you press run.',
        }}
        right={{
          id: 'toolkit-encrypt-payload',
          label: 'Encrypted Payload',
          value: encryptedDocument,
          onChange: setEncryptedDocument,
          readOnly: mode === 'encrypt',
          placeholder:
            mode === 'encrypt'
              ? 'Output will appear here after you press run.'
              : 'Paste encrypted payload JSON here.',
          downloadName: 'encrypted-document.json',
        }}
      />
      {status && (
        <StatusNote
          kind={status.kind}
          message={status.message}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  )
}

export default EncryptDecryptTool
