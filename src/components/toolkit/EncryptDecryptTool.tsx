import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import ModeToggle from './ModeToggle'
import DualJsonPanes from './DualJsonPanes'
import StatusNote from './StatusNote'
import ToolkitIcon from './ToolkitIcon'
import { TOOLKIT_ASSETS } from './assets'
import { SAMPLE_RAW_V2_DOCUMENT } from '@/utils/toolkit/types'
import {
  decryptDocument,
  encryptDocument,
  generateEncryptionKey,
  loadEncryptedFromActionUrl,
  toEncryptErrorMessage,
} from '@/utils/toolkit/encrypt'

type EncryptDecryptToolProps = {
  isDarkMode: boolean
  sampleTick?: number
}

const SAMPLE_JSON = JSON.stringify(SAMPLE_RAW_V2_DOCUMENT, null, 2)

const fieldClass = (isDarkMode: boolean) =>
  clsx(
    'h-11 w-full min-w-0 rounded-lg border px-3 font-mono text-sm md:h-10 md:flex-1 md:text-xs',
    isDarkMode
      ? 'bg-transparent border-white/20 text-neutral-60 placeholder:text-neutral-30'
      : 'bg-white border-neutral-50 text-neutral-10 placeholder:text-neutral-30'
  )

const EncryptDecryptTool = ({
  isDarkMode,
  sampleTick = 0,
}: EncryptDecryptToolProps) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [key, setKey] = useState('')
  const [url, setUrl] = useState('')
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [encryptInput, setEncryptInput] = useState('')
  const [encryptOutput, setEncryptOutput] = useState('')
  const [decryptInput, setDecryptInput] = useState('')
  const [decryptOutput, setDecryptOutput] = useState('')
  const [keyCopied, setKeyCopied] = useState(false)
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const modeRef = useRef(mode)
  const keyRef = useRef(key)
  const loadRequestIdRef = useRef(0)
  const keyCopyTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  modeRef.current = mode
  keyRef.current = key

  const invalidatePendingLoad = () => {
    loadRequestIdRef.current += 1
    setIsLoadingUrl(false)
  }

  useEffect(() => {
    return () => clearTimeout(keyCopyTimeoutRef.current)
  }, [])

  const copyKey = async () => {
    if (!key) return
    try {
      await navigator.clipboard.writeText(key)
      setKeyCopied(true)
      clearTimeout(keyCopyTimeoutRef.current)
      keyCopyTimeoutRef.current = setTimeout(() => setKeyCopied(false), 1500)
    } catch {
      setStatus({
        kind: 'error',
        message:
          'Could not copy the key. Your browser may be blocking clipboard access.',
      })
    }
  }

  useEffect(() => {
    if (sampleTick === 0) return
    invalidatePendingLoad()
    setStatus(null)
    if (modeRef.current === 'decrypt') {
      try {
        const sampleKey = keyRef.current || generateEncryptionKey()
        setKey(sampleKey)
        const encrypted = encryptDocument(SAMPLE_JSON, sampleKey)
        setDecryptInput(JSON.stringify(encrypted, undefined, 2))
        setDecryptOutput('')
      } catch {
        setDecryptInput('')
        setDecryptOutput('')
      }
      return
    }
    setEncryptInput(SAMPLE_JSON)
    setEncryptOutput('')
  }, [sampleTick])

  const run = () => {
    invalidatePendingLoad()
    setStatus(null)
    try {
      if (mode === 'encrypt') {
        const encrypted = encryptDocument(encryptInput, key)
        setEncryptOutput(JSON.stringify(encrypted, undefined, 2))
        setStatus({
          kind: 'success',
          message: 'Document encrypted successfully.',
        })
        return
      }
      const decrypted = decryptDocument(decryptInput, key)
      setDecryptOutput(decrypted)
      const parsed = JSON.parse(decryptInput) as { key?: string }
      if (parsed.key) setKey(parsed.key)
      setStatus({
        kind: 'success',
        message: 'Document decrypted successfully.',
      })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: toEncryptErrorMessage(error, mode),
      })
    }
  }

  const loadFromUrl = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl || isLoadingUrl) return
    const requestId = ++loadRequestIdRef.current
    setStatus(null)
    setIsLoadingUrl(true)
    try {
      const loaded = await loadEncryptedFromActionUrl(trimmedUrl)
      if (requestId !== loadRequestIdRef.current) return
      const payloadJson = JSON.stringify(loaded.payload, undefined, 2)
      setKey(loaded.key)
      setEncryptInput('')
      setEncryptOutput(payloadJson)
      setDecryptInput(payloadJson)
      setDecryptOutput('')
      setStatus({
        kind: 'success',
        message: 'Encrypted document loaded from URL.',
      })
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) return
      setStatus({
        kind: 'error',
        message: toEncryptErrorMessage(error, 'decrypt'),
      })
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoadingUrl(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8 min-w-0">
      <div className="flex w-full min-w-0 flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-3">
        <ModeToggle
          value={mode}
          options={[
            { id: 'encrypt', label: 'Encrypt' },
            { id: 'decrypt', label: 'Decrypt' },
          ]}
          onChange={next => {
            invalidatePendingLoad()
            setMode(next)
            setStatus(null)
          }}
          isDarkMode={isDarkMode}
        />
        <input
          id="toolkit-encrypt-key"
          value={key}
          onChange={event => {
            invalidatePendingLoad()
            setKey(event.target.value)
          }}
          aria-label="Key"
          placeholder="tvc-preview-key"
          className={fieldClass(isDarkMode)}
        />
        <button
          type="button"
          onClick={() => void copyKey()}
          disabled={!key}
          aria-label={keyCopied ? 'Key copied' : 'Copy key to clipboard'}
          title={keyCopied ? 'Copied!' : 'Copy key'}
          className={clsx(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border md:h-10 md:w-10',
            'disabled:cursor-not-allowed disabled:opacity-40',
            isDarkMode ? 'border-white/20' : 'border-neutral-50'
          )}
        >
          <ToolkitIcon
            src={keyCopied ? TOOLKIT_ASSETS.checkCircle : TOOLKIT_ASSETS.copy}
            alt=""
            size={18}
          />
        </button>
        {mode === 'encrypt' && (
          <button
            type="button"
            onClick={() => {
              invalidatePendingLoad()
              setKey(generateEncryptionKey())
              setEncryptOutput('')
              setStatus(null)
            }}
            className="h-11 w-full shrink-0 rounded-lg bg-gradient-to-r from-primary-60 to-secondary-60 px-5 font-urbanist text-sm font-bold text-white md:h-10 md:w-auto"
          >
            Generate
          </button>
        )}
      </div>

      {mode === 'decrypt' && (
        <div className="flex w-full min-w-0 flex-col gap-2">
          <label
            htmlFor="toolkit-encrypt-url"
            className={clsx(
              'font-urbanist font-bold text-sm',
              isDarkMode ? 'text-neutral-60' : 'text-neutral-10'
            )}
          >
            Document URL
          </label>
          <div className="flex w-full min-w-0 flex-col items-stretch gap-3 md:flex-row md:items-center md:gap-3">
            <input
              id="toolkit-encrypt-url"
              value={url}
              onChange={event => {
                invalidatePendingLoad()
                setUrl(event.target.value)
              }}
              onKeyDown={event => {
                if (event.key === 'Enter') void loadFromUrl()
              }}
              placeholder="Paste an action URL"
              className={fieldClass(isDarkMode)}
            />
            <button
              type="button"
              onClick={() => void loadFromUrl()}
              disabled={!url.trim() || isLoadingUrl}
              className="h-11 w-full shrink-0 rounded-lg bg-gradient-to-r from-primary-60 to-secondary-60 px-5 font-urbanist text-sm font-bold text-white disabled:opacity-50 md:h-10 md:w-auto"
            >
              {isLoadingUrl ? 'Loading…' : 'Load'}
            </button>
          </div>
        </div>
      )}

      <DualJsonPanes
        isDarkMode={isDarkMode}
        onRun={run}
        runLabel={mode === 'encrypt' ? 'Encrypt document' : 'Decrypt document'}
        left={
          mode === 'encrypt'
            ? {
                id: 'toolkit-encrypt-raw',
                label: 'Document JSON',
                value: encryptInput,
                onChange: value => {
                  invalidatePendingLoad()
                  setEncryptInput(value)
                },
                placeholder:
                  'Paste document JSON here, e.g. {"bolNumber" : "BOL - 88213" , "Cargo" : "Refined Copper"}',
              }
            : {
                id: 'toolkit-encrypt-payload',
                label: 'Encrypted Payload',
                value: decryptInput,
                onChange: value => {
                  invalidatePendingLoad()
                  setDecryptInput(value)
                },
                placeholder: 'Paste encrypted payload JSON here.',
              }
        }
        right={
          mode === 'encrypt'
            ? {
                id: 'toolkit-encrypt-payload',
                label: 'Encrypted Payload',
                value: encryptOutput,
                readOnly: true,
                placeholder: 'Output will appear here after you press run.',
                downloadName: 'encrypted-document.json',
              }
            : {
                id: 'toolkit-encrypt-raw',
                label: 'Document JSON',
                value: decryptOutput,
                readOnly: true,
                placeholder: 'Output will appear here after you press run.',
                downloadName: 'decrypted-document.json',
              }
        }
      />
      {status && <StatusNote kind={status.kind} message={status.message} />}
    </div>
  )
}

export default EncryptDecryptTool
