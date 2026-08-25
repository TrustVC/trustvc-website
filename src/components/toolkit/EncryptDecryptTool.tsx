import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import ModeToggle from './ModeToggle'
import DualJsonPanes from './DualJsonPanes'
import StatusNote from './StatusNote'
import { SAMPLE_RAW_V2_DOCUMENT } from '@/utils/toolkit/types'
import {
  decryptDocument,
  encryptDocument,
  generateEncryptionKey,
} from '@/utils/toolkit/encrypt'

type EncryptDecryptToolProps = {
  isDarkMode: boolean
  sampleTick?: number
}

const SAMPLE_JSON = JSON.stringify(SAMPLE_RAW_V2_DOCUMENT, null, 2)

const EncryptDecryptTool = ({
  isDarkMode,
  sampleTick = 0,
}: EncryptDecryptToolProps) => {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [key, setKey] = useState('')
  const [encryptInput, setEncryptInput] = useState('')
  const [encryptOutput, setEncryptOutput] = useState('')
  const [decryptInput, setDecryptInput] = useState('')
  const [decryptOutput, setDecryptOutput] = useState('')
  const [status, setStatus] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const modeRef = useRef(mode)
  const keyRef = useRef(key)
  modeRef.current = mode
  keyRef.current = key

  useEffect(() => {
    if (sampleTick === 0) return
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
        message:
          error instanceof Error
            ? error.message
            : 'Unable to process document.',
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
        {mode === 'encrypt' && (
          <button
            type="button"
            onClick={() => {
              setKey(generateEncryptionKey())
              setEncryptOutput('')
              setStatus(null)
            }}
            className="h-10 shrink-0 rounded-lg bg-gradient-to-r from-primary-60 to-secondary-60 px-5 font-urbanist text-sm font-bold text-white"
          >
            Generate
          </button>
        )}
      </div>

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
                onChange: setEncryptInput,
                placeholder:
                  'Paste document JSON here, e.g. {"bolNumber" : "BOL - 88213" , "Cargo" : "Refined Copper"}',
              }
            : {
                id: 'toolkit-encrypt-payload',
                label: 'Encrypted Payload',
                value: decryptInput,
                onChange: setDecryptInput,
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
