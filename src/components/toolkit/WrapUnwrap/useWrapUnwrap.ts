import { useState } from 'react'
import {
  wrapOADocument,
  getDataV2,
  isWrappedV2Document,
  isWrappedV3Document,
  isRawV2Document,
  isRawV3Document,
} from '@trustvc/trustvc'

export type WrapMode = 'wrap' | 'unwrap'
export type WrapStatus = 'initial' | 'success' | 'error'

export const useWrapUnwrap = () => {
  const [mode, setMode] = useState<WrapMode>('wrap')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<WrapStatus>('initial')
  const [error, setError] = useState('')

  const reset = () => {
    setOutput('')
    setStatus('initial')
    setError('')
  }

  const fail = (message: string) => {
    setStatus('error')
    setError(message)
    setOutput('')
  }

  const run = async () => {
    reset()
    let parsed: unknown
    try {
      parsed = JSON.parse(input)
    } catch {
      fail('This is not valid JSON — paste a document to continue.')
      return
    }

    try {
      if (mode === 'wrap') {
        if (!isRawV2Document(parsed) && !isRawV3Document(parsed)) {
          fail('This does not look like a raw OpenAttestation v2/v3 document.')
          return
        }
        const wrapped = await wrapOADocument(parsed as never)
        setOutput(JSON.stringify(wrapped, null, 2))
      } else {
        if (isWrappedV2Document(parsed)) {
          setOutput(JSON.stringify(getDataV2(parsed as never), null, 2))
        } else if (isWrappedV3Document(parsed)) {
          const { proof: _proof, ...rest } = parsed as Record<string, unknown>
          setOutput(JSON.stringify(rest, null, 2))
        } else {
          fail('This is not a wrapped OpenAttestation v2/v3 document.')
          return
        }
      }
      setStatus('success')
    } catch (e) {
      fail(e instanceof Error ? e.message : 'Operation failed')
    }
  }

  const switchMode = (next: WrapMode) => {
    setMode(next)
    setInput('')
    reset()
  }

  return { mode, switchMode, input, setInput, output, status, error, run }
}
