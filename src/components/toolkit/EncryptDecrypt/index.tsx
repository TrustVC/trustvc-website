import { useState } from 'react'
import { Lock } from 'react-feather'
import { encryptString, decryptString } from '@trustvc/trustvc'
import {
  ToolCard,
  JsonTextarea,
  CopyButton,
  StatusAlert,
} from '@/components/toolkit/shared'

type EncMode = 'encrypt' | 'decrypt'
type EncStatus = 'initial' | 'success' | 'error'

const EncryptDecrypt = () => {
  const [mode, setMode] = useState<EncMode>('encrypt')
  const [document, setDocument] = useState('')
  const [payload, setPayload] = useState('')
  const [key, setKey] = useState('')
  const [status, setStatus] = useState<EncStatus>('initial')
  const [error, setError] = useState('')

  const fail = (message: string) => {
    setStatus('error')
    setError(message)
  }

  const switchMode = (next: EncMode) => {
    setMode(next)
    setDocument('')
    setPayload('')
    setKey('')
    setStatus('initial')
    setError('')
  }

  const runEncrypt = () => {
    setStatus('initial')
    try {
      JSON.parse(document)
    } catch {
      fail('This is not valid JSON — paste a document to continue.')
      return
    }
    try {
      const { key: generatedKey, ...rest } = encryptString(document)
      setPayload(JSON.stringify(rest, null, 2))
      setKey(generatedKey)
      setStatus('success')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Encryption failed')
    }
  }

  const runDecrypt = () => {
    setStatus('initial')
    let parsed: { cipherText: string; iv: string; tag: string; type: string }
    try {
      parsed = JSON.parse(payload)
    } catch {
      fail('The encrypted payload is not valid JSON.')
      return
    }
    if (!key.trim()) {
      fail('Enter the decryption key.')
      return
    }
    try {
      const plain = decryptString({ ...parsed, key: key.trim() } as never)
      setDocument(JSON.stringify(JSON.parse(plain), null, 2))
      setStatus('success')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Decryption failed')
    }
  }

  return (
    <ToolCard
      icon={<Lock size={22} />}
      title="Encrypt / Decrypt"
      description="Encrypt a document for safe transmission — the key is generated locally and shown once. Decrypt an encrypted payload with its key to recover the original document."
    >
      <div className="mb-6 inline-flex rounded-full border border-neutral-60 bg-white p-1">
        <button
          type="button"
          aria-label="Encrypt mode"
          onClick={() => switchMode('encrypt')}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold ${
            mode === 'encrypt' ? 'bg-primary-60 text-white' : 'text-neutral-30'
          }`}
        >
          Encrypt
        </button>
        <button
          type="button"
          aria-label="Decrypt mode"
          onClick={() => switchMode('decrypt')}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold ${
            mode === 'decrypt' ? 'bg-primary-60 text-white' : 'text-neutral-30'
          }`}
        >
          Decrypt
        </button>
      </div>

      {status === 'error' && (
        <div className="mb-4">
          <StatusAlert variant="error">{error}</StatusAlert>
        </div>
      )}
      {status === 'success' && mode === 'encrypt' && (
        <div className="mb-4">
          <StatusAlert variant="warning">
            Save this key now — it is shown only once and cannot be recovered.
          </StatusAlert>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <JsonTextarea
          id="enc-document"
          label="Document"
          value={document}
          onChange={mode === 'encrypt' ? setDocument : undefined}
          readOnly={mode === 'decrypt'}
          placeholder={
            mode === 'encrypt'
              ? 'Paste the document JSON to encrypt'
              : 'Decrypted document appears here'
          }
        />
        <JsonTextarea
          id="enc-payload"
          label="Encrypted Payload"
          value={payload}
          onChange={mode === 'decrypt' ? setPayload : undefined}
          readOnly={mode === 'encrypt'}
          placeholder={
            mode === 'encrypt'
              ? 'Encrypted payload appears here'
              : 'Paste the encrypted payload JSON ({"cipherText": …})'
          }
          actions={
            mode === 'encrypt' ? (
              <CopyButton getText={() => payload} />
            ) : undefined
          }
        />
        <div className="flex flex-col gap-2">
          <label
            htmlFor="enc-key"
            className="text-sm font-semibold text-neutral-10"
          >
            {mode === 'encrypt'
              ? 'Encryption Key (generated)'
              : 'Decryption Key'}
          </label>
          <div className="flex gap-2">
            <input
              id="enc-key"
              value={key}
              onChange={e => setKey(e.target.value)}
              readOnly={mode === 'encrypt'}
              placeholder={mode === 'decrypt' ? 'Paste the hex key' : ''}
              className="w-full rounded-lg border border-neutral-60 px-3 py-2 font-mono text-sm focus:border-primary-60 focus:outline-none"
            />
            {mode === 'encrypt' && key && (
              <CopyButton getText={() => key} label="Copy key" />
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={mode === 'encrypt' ? runEncrypt : runDecrypt}
          className="self-start rounded-lg bg-primary-60 px-8 py-2 text-sm font-semibold capitalize text-white hover:bg-primary-50"
        >
          {mode}
        </button>
      </div>
    </ToolCard>
  )
}

export default EncryptDecrypt
